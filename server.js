
/* ========================================
   SERVIDOR - SMS HOMOLOGADO
   INTEGRAÇÃO ONE360
======================================== */

require("dotenv").config();

const express = require("express");
const path = require("path");
const crypto = require("node:crypto");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const ONE360_BASE_URL = process.env.ONE360_BASE_URL;
const ONE360_API_KEY = process.env.ONE360_API_KEY;
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

const QUEUE_ID = Number(process.env.ONE360_QUEUE_ID);
const PIPELINE_ID = Number(process.env.ONE360_PIPELINE_ID);
const STAGE_ID = Number(process.env.ONE360_STAGE_ID);
const RESPONSIBLE_ID = Number(process.env.ONE360_RESPONSIBLE_ID);

/* ========================================
   CONFIGURAÇÕES
======================================== */

app.disable("x-powered-by");

app.use(express.json({ limit: "16kb" }));

app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/img", express.static(path.join(__dirname, "img")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "online",
        projeto: "SMS Homologado",
        mensagem: "Servidor funcionando!"
    });
});

/* ========================================
   VALIDAÇÃO
======================================== */

function normalizarTelefone(valor) {
    let telefone = String(valor ?? "").replace(/\D/g, "");

    if (telefone.startsWith("55") && [12, 13].includes(telefone.length)) {
        telefone = telefone.slice(2);
    }

    if (!/^[1-9]{2}\d{8,9}$/.test(telefone)) {
        return null;
    }

    return `+55${telefone}`;
}

function configuracaoValida() {
    return Boolean(
        ONE360_BASE_URL &&
        ONE360_API_KEY &&
        [QUEUE_ID, PIPELINE_ID, STAGE_ID, RESPONSIBLE_ID]
            .every(id => Number.isInteger(id) && id > 0)
    );
}

/* ========================================
   PROTEÇÃO CONTRA SPAM - RATE LIMIT
======================================== */

const limitadorLeads = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Muitas solicitações realizadas. Aguarde 15 minutos antes de tentar novamente."
    }
});

/* ========================================
   PROTEÇÃO CONTRA ENVIOS DUPLICADOS
======================================== */

// Funciona neste processo Node.js. Ao reiniciar o servidor,
// esse histórico é apagado.
const registrosDeEnvio = new Map();

const TEMPO_DUPLICIDADE_MS = 15 * 60 * 1000;
const TEMPO_INCERTEZA_MS = 3 * 60 * 1000;

function gerarChaveDoEnvio(nome, telefone, email, credito) {
    const dados = [
        nome.replace(/\s+/g, " ").toLowerCase(),
        telefone,
        email.toLowerCase(),
        credito.replace(/\s+/g, " ").toLowerCase()
    ];

    // O cache não guarda nome, telefone ou e-mail em texto puro.
    return crypto.createHmac("sha256", ONE360_API_KEY)
        .update(JSON.stringify(dados))
        .digest("hex");
}

function limparRegistrosExpirados() {
    const agora = Date.now();

    for (const [chave, registro] of registrosDeEnvio) {
        if (
            registro.estado !== "pendente" &&
            registro.expiraEm <= agora
        ) {
            registrosDeEnvio.delete(chave);
        }
    }
}

function responderCriacao(res, resultado, repetido) {
    if (!resultado.sucesso) {
        return res.status(502).json({
            success: false,
            message:
                "Não foi possível confirmar o cadastro. " +
                "Confira a One360 antes de tentar novamente."
        });
    }

    return res.status(repetido ? 200 : 201).json({
        success: true,
        message: repetido
            ? "Solicitação já registrada anteriormente."
            : "Oportunidade criada com sucesso!",
        opportunityId: resultado.id
    });
}

/* ========================================
   COMUNICAÇÃO COM A ONE360
======================================== */

async function enviarOportunidade(oportunidade) {
    try {
        const url = new URL(
            "/int/createOpportunity",
            ONE360_BASE_URL
        );

        if (url.protocol !== "https:") {
            throw new Error("URL da API sem HTTPS.");
        }

        const resposta = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(oportunidade),
            signal: AbortSignal.timeout(15000)
        });

        const resultado = await resposta.json()
            .catch(() => null);

        if (!resposta.ok) {
            console.error(
                "Erro da One360. HTTP:",
                resposta.status,
                "Código:",
                resultado?.errorCode || "Não informado"
            );

            return { sucesso: false };
        }

        if (
            !Number.isInteger(resultado?.id) ||
            resultado.id <= 0
        ) {
            console.error("Resposta inesperada da One360.");
            return { sucesso: false };
        }

        console.log(
            "Oportunidade criada. ID:",
            resultado.id
        );

        return {
            sucesso: true,
            id: resultado.id
        };

    } catch (erro) {
        console.error(
            "Falha na integração One360:",
            erro.name
        );

        return { sucesso: false };
    }
}


/* ========================================
   VALIDAÇÃO DE SEGURANÇA - CLOUDFLARE
======================================== */

async function verificarTurnstile(token) {

    const dados = new URLSearchParams({
        secret: TURNSTILE_SECRET_KEY,
        response: token
    });

    const resposta = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },

            body: dados.toString(),

            signal: AbortSignal.timeout(10000)
        }
    );

    if (!resposta.ok) {
        throw new Error(
            `Falha na verificação Cloudflare: HTTP ${resposta.status}`
        );
    }

    const resultado = await resposta.json();

    return resultado.success === true;
}


/* ========================================
   RECEBER LEAD E CRIAR OPORTUNIDADE
======================================== */

app.post("/api/leads", limitadorLeads, async (req, res) => {
    const body = req.body;

    if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body)
    ) {
        return res.status(400).json({
            success: false,
            message: "Dados inválidos."
        });
    }

    const { name, phone, email, credit, turnstileToken} = body;

    const nome = typeof name === "string"
        ? name.trim()
        : "";

    const emailCliente = typeof email === "string"
        ? email.trim()
        : "";

    const credito = typeof credit === "string"
        ? credit.trim()
        : "";

    const telefone = normalizarTelefone(phone);

    // Validar os campos do formulário.
    if (
        nome.length < 2 ||
        nome.length > 100 ||
        !telefone ||
        emailCliente.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailCliente) ||
        credito.length > 50
    ) {
        return res.status(400).json({
            success: false,
            message: "Confira os dados do formulário."
        });
    }

    // Conferir configurações da API.
    if (!configuracaoValida()) {
        console.error("Configuração da One360 incompleta.");

        return res.status(503).json({
            success: false,
            message: "Integração indisponível."
        });
    }
    

    /* ========================================
    VERIFICAR TURNSTILE ANTES DA ONE360
    ======================================= */

    // A integração não deve funcionar sem a chave secreta.
    if (!TURNSTILE_SECRET_KEY) {

        console.error("Chave Turnstile não configurada.");

        return res.status(503).json({
            success: false,
            message: "Verificação de segurança indisponível."
        });
    }

    // Recusar solicitações sem um token válido em formato.
    if (typeof turnstileToken !== "string" || !turnstileToken.trim() || turnstileToken.length > 2048) {

        return res.status(400).json({
            success: false,
            message: "Verificação de segurança obrigatória."
        });
    }

    try {

        const tokenValido = await verificarTurnstile(
            turnstileToken.trim()
        );

        if (!tokenValido) {

            return res.status(403).json({
                success: false, message:
                "Não foi possível validar a verificação de segurança. " +
                "Atualize a verificação e tente novamente."
            });
        }

    } catch (erro) {

        console.error(
            "Falha na validação Turnstile:",
            erro.name
        );

        return res.status(503).json({
            success: false,
            message: "Verificação de segurança temporariamente indisponível."
        });
    }

    limparRegistrosExpirados();

    const chave = gerarChaveDoEnvio(
        nome,
        telefone,
        emailCliente,
        credito
    );

    const registroAnterior = registrosDeEnvio.get(chave);

    /* ========================================
       VERIFICAR SE JÁ EXISTE ENVIO
    ======================================== */

    if (registroAnterior) {

        // A OP já foi criada. Retornar o mesmo ID.
        if (registroAnterior.estado === "concluido") {
            return responderCriacao(
                res,
                {
                    sucesso: true,
                    id: registroAnterior.id
                },
                true
            );
        }

        // A tentativa anterior teve resultado incerto.
        if (registroAnterior.estado === "incerto") {
            return res.status(409).json({
                success: false,
                message:
                    "Um envio recente não pôde ser confirmado. " +
                    "Confira a One360 antes de tentar novamente."
            });
        }

        // A primeira solicitação ainda está sendo processada.
        if (registroAnterior.estado === "pendente") {
            const resultado = await registroAnterior.promessa;

            return responderCriacao(res, resultado, true);
        }
    }

    /* ========================================
       MONTAR OPORTUNIDADE
    ======================================== */

    const oportunidade = {
        queueId: QUEUE_ID,
        apiKey: ONE360_API_KEY,

        fkPipeline: PIPELINE_ID,
        fkStage: STAGE_ID,
        responsableid: RESPONSIBLE_ID,

        title: `Lead - ${nome}`,

        mainphone: telefone,
        mainmail: emailCliente,

        description: [
            "Origem: Landing Page SMS Homologado",
            `Nome: ${nome}`,
            `Interesse em créditos: ${credito || "Não informado"}`
        ].join("\n")
    };

    /* ========================================
       ENVIAR COM PROTEÇÃO CONTRA DUPLICIDADE
    ======================================== */

    // Registra antes de aguardar a API.
    // Assim, cliques simultâneos não criam duas oportunidades.
    const promessa = enviarOportunidade(oportunidade);

    registrosDeEnvio.set(chave, {
        estado: "pendente",
        promessa
    });

    const resultado = await promessa;

    if (resultado.sucesso) {

        registrosDeEnvio.set(chave, {
            estado: "concluido",
            id: resultado.id,
            expiraEm: Date.now() + TEMPO_DUPLICIDADE_MS
        });

    } else {

        // A falha pode ter ocorrido após a criação da OP.
        // Por segurança, suspende novas tentativas idênticas
        // por um período curto.
        registrosDeEnvio.set(chave, {
            estado: "incerto",
            expiraEm: Date.now() + TEMPO_INCERTEZA_MS
        });

    }

    return responderCriacao(res, resultado, false);
});

/* ========================================
   INICIAR SERVIDOR LOCAL
======================================== */

app.listen(PORT, "127.0.0.1", () => {
    console.log("==============================");
    console.log(" SMS HOMOLOGADO - API LOCAL");
    console.log("==============================");
    console.log(`Servidor: http://localhost:${PORT}`);
    console.log("Status: Online");
});
