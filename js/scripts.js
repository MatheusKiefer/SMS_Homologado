
/* ========================================
   SMS HOMOLOGADO - JAVASCRIPT
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ========================================
       1. MENU MOBILE
    ======================================== */

    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (menuToggle && navLinks) {

        function toggleMenu(open) {
            navLinks.classList.toggle("is-open", open);
            menuToggle.setAttribute("aria-expanded", String(open));
            menuToggle.setAttribute(
                "aria-label",
                open ? "Fechar menu" : "Abrir menu"
            );
        }

        menuToggle.addEventListener("click", () => {
            const isOpen =
                menuToggle.getAttribute("aria-expanded") === "true";
            toggleMenu(!isOpen);
        });

        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => toggleMenu(false));
        });

        document.addEventListener("keydown", event => {
            if (
                event.key === "Escape" &&
                menuToggle.getAttribute("aria-expanded") === "true"
            ) {
                toggleMenu(false);
                menuToggle.focus();
            }
        });

        window.matchMedia("(min-width: 901px)")
            .addEventListener("change", event => {
                if (event.matches) toggleMenu(false);
            });
    }


    /* ========================================
       2. CARROSSEL 3D - EXEMPLOS DE USO
    ======================================== */

    const carousel = document.querySelector(".usage-carousel");

    if (carousel) {
        const cards = Array.from(
            carousel.querySelectorAll(".usage-card")
        );

        const prevButton = carousel.querySelector(".usage-prev");
        const nextButton = carousel.querySelector(".usage-next");
        const stage = carousel.querySelector(".usage-stage");
        const counter = document.querySelector(".usage-counter");

        if (cards.length && prevButton && nextButton && stage) {
            const totalCards = cards.length;

            let activeIndex = cards.findIndex(card =>
                card.classList.contains("is-active")
            );

            if (activeIndex === -1) activeIndex = 0;

            function updateCarousel() {
                cards.forEach((card, index) => {
                    let offset = index - activeIndex;

                    if (offset > totalCards / 2) {
                        offset -= totalCards;
                    }

                    if (offset < -totalCards / 2) {
                        offset += totalCards;
                    }

                    const distance = Math.abs(offset);
                    const isActive = index === activeIndex;

                    card.style.setProperty("--offset", offset);
                    card.style.setProperty("--distance", distance);
                    card.classList.toggle("is-active", isActive);

                    if (isActive) {
                        card.setAttribute("aria-current", "true");
                    } else {
                        card.removeAttribute("aria-current");
                    }

                    const whatsappButton =
                        card.querySelector(".usage-whatsapp");

                    if (whatsappButton) {
                        whatsappButton.tabIndex = isActive ? 0 : -1;
                        whatsappButton.style.pointerEvents =
                            isActive ? "auto" : "none";
                    }
                });

                if (counter) {
                    counter.textContent =
                        `${activeIndex + 1} de ${totalCards}`;
                }
            }

            function selectCard(index) {
                activeIndex =
                    ((index % totalCards) + totalCards) % totalCards;

                updateCarousel();
            }

            nextButton.addEventListener("click", () => {
                selectCard(activeIndex + 1);
            });

            prevButton.addEventListener("click", () => {
                selectCard(activeIndex - 1);
            });

            carousel.addEventListener("keydown", event => {
                if (event.key === "ArrowRight") {
                    event.preventDefault();
                    selectCard(activeIndex + 1);
                } else if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    selectCard(activeIndex - 1);
                }
            });

            // Navegação por deslize no celular.
            let touchStartX = null;
            let touchStartY = null;
            const swipeThreshold = 45;

            stage.addEventListener("touchstart", event => {
                if (event.touches.length !== 1) return;

                touchStartX = event.touches[0].clientX;
                touchStartY = event.touches[0].clientY;
            }, { passive: true });

            stage.addEventListener("touchend", event => {
                if (
                    touchStartX === null ||
                    touchStartY === null ||
                    !event.changedTouches.length
                ) return;

                const differenceX =
                    touchStartX - event.changedTouches[0].clientX;

                const differenceY =
                    touchStartY - event.changedTouches[0].clientY;

                if (
                    Math.abs(differenceX) > swipeThreshold &&
                    Math.abs(differenceX) > Math.abs(differenceY)
                ) {
                    selectCard(
                        activeIndex + (differenceX > 0 ? 1 : -1)
                    );
                }

                touchStartX = null;
                touchStartY = null;
            }, { passive: true });

            stage.addEventListener("touchcancel", () => {
                touchStartX = null;
                touchStartY = null;
            });

            updateCarousel();
        }
    }


    /* ========================================
       3. MODAL DE CONTRATAÇÃO + ONE360 + AGRADECIMENTO
    ======================================== */

    const modal = document.querySelector("#contract-modal");
    const closeButton = document.querySelector(".contract-close");
    const form = document.querySelector("#contract-form");

    // Inclui botões do cabeçalho, rodapé, cards e fim do carrossel.
    const openButtons = document.querySelectorAll(
        "#open-contract-modal, .btn-quote, .usage-whatsapp, .usage-btn"
    );

    if (modal && closeButton && form) {
        const nomeInput = form.querySelector("#contract-name");
        const telefoneInput = form.querySelector("#contract-phone");
        const emailInput = form.querySelector("#contract-email");
        const botaoEnviar = form.querySelector('button[type="submit"]');

        if (nomeInput && telefoneInput && emailInput && botaoEnviar) {
            let creditoSelecionado = "";
            let enviando = false;

            // Adequa os textos antigos que ainda mencionam WhatsApp no HTML.
            // Mantém ícones e elementos internos dos botões intactos.
            function substituirTextoWhatsApp(elemento, novoTexto) {
                const percorredor = document.createTreeWalker(
                    elemento,
                    NodeFilter.SHOW_TEXT
                );

                while (percorredor.nextNode()) {
                    const trecho = percorredor.currentNode;

                    if (/whats\s*app/i.test(trecho.nodeValue)) {
                        trecho.nodeValue = trecho.nodeValue.replace(
                            /[^\n]*whats\s*app[^\n]*/i,
                            novoTexto
                        );
                    }
                }
            }

            substituirTextoWhatsApp(botaoEnviar, "Enviar solicitação");

            openButtons.forEach(botao => {
                substituirTextoWhatsApp(botao, "Solicitar informações");
            });

            const htmlOriginalBotao = botaoEnviar.innerHTML;
            const tituloOriginalModal = modal.getAttribute("aria-labelledby");

            /* ========================================
               4. SOM DE CONFIRMAÇÃO
            ======================================== */

            // Mude para false caso prefira uma confirmação silenciosa.
            const SOM_CONFIRMACAO_ATIVO = true;

            let contextoAudioConfirmacao = null;

            // O navegador exige a liberação do áudio durante uma interação
            // do usuário. Fazemos isso no envio, antes da requisição à API.
            function prepararSomConfirmacao() {
                if (!SOM_CONFIRMACAO_ATIVO) return;

                const AudioContextClass =
                    window.AudioContext || window.webkitAudioContext;

                if (!AudioContextClass) return;

                try {
                    if (!contextoAudioConfirmacao) {
                        contextoAudioConfirmacao = new AudioContextClass();
                    }

                    if (contextoAudioConfirmacao.state === "suspended") {
                        contextoAudioConfirmacao.resume().catch(() => {});
                    }
                } catch (_) {
                    // Se o dispositivo bloquear áudio, o cadastro continua.
                }
            }

            // Som curto e delicado, criado via Web Audio API.
            // Nenhum arquivo .mp3 é necessário.
            function tocarSomConfirmacao() {
                const audio = contextoAudioConfirmacao;

                if (
                    !SOM_CONFIRMACAO_ATIVO ||
                    !audio ||
                    audio.state !== "running"
                ) return;

                try {
                    const inicio = audio.currentTime + 0.03;

                    const notas = [
                        { frequencia: 660, atraso: 0, duracao: 0.14 },
                        { frequencia: 880, atraso: 0.12, duracao: 0.20 }
                    ];

                    notas.forEach(nota => {
                        const oscilador = audio.createOscillator();
                        const volume = audio.createGain();
                        const quando = inicio + nota.atraso;

                        oscilador.type = "sine";

                        oscilador.frequency.setValueAtTime(
                            nota.frequencia,
                            quando
                        );

                        volume.gain.setValueAtTime(
                            0.0001,
                            quando
                        );

                        volume.gain.exponentialRampToValueAtTime(
                            0.10,
                            quando + 0.025
                        );

                        volume.gain.exponentialRampToValueAtTime(
                            0.0001,
                            quando + nota.duracao
                        );

                        oscilador.connect(volume);
                        volume.connect(audio.destination);

                        oscilador.start(quando);
                        oscilador.stop(quando + nota.duracao + 0.02);
                    });
                } catch (_) {
                    // A confirmação visual funciona mesmo sem som.
                }
            }


            /* ========================================
               5. TELA DE AGRADECIMENTO NO MESMO POP-UP
            ======================================== */

            // Criada via JS para não precisar modificar o HTML existente.
            const telaSucesso = document.createElement("section");

            telaSucesso.className = "contract-success";
            telaSucesso.hidden = true;

            telaSucesso.setAttribute(
                "aria-labelledby",
                "contract-success-title"
            );

            telaSucesso.setAttribute(
                "aria-live",
                "polite"
            );

            telaSucesso.innerHTML = `
                <div class="contract-success-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2.5"
                         stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 6 9 17l-5-5" pathLength="100"></path>
                    </svg>

                    <span class="contract-success-sparkle sparkle-1"></span>
                    <span class="contract-success-sparkle sparkle-2"></span>
                    <span class="contract-success-sparkle sparkle-3"></span>
                    <span class="contract-success-sparkle sparkle-4"></span>
                    <span class="contract-success-sparkle sparkle-5"></span>
                </div>

                <h2 id="contract-success-title">
                    Solicitação recebida!
                </h2>

                <p>
                    Obrigado por compartilhar suas informações.
                </p>

                <p>
                    Em breve, um de nossos especialistas entrará
                    em contato com você.
                </p>

                <button
                    type="button"
                    class="contract-success-close"
                >
                    Fechar
                </button>
            `;

            modal.appendChild(telaSucesso);

            const fecharSucesso = telaSucesso.querySelector(
                ".contract-success-close"
            );

            function mostrarFormulario() {
                telaSucesso.classList.remove("is-animated");
                telaSucesso.hidden = true;
                form.hidden = false;

                if (tituloOriginalModal) {
                    modal.setAttribute(
                        "aria-labelledby",
                        tituloOriginalModal
                    );
                } else {
                    modal.removeAttribute("aria-labelledby");
                }
            }

            function mostrarAgradecimento() {
                // Reinicia a animação a cada envio bem-sucedido.
                telaSucesso.classList.remove("is-animated");

                form.hidden = true;
                telaSucesso.hidden = false;

                modal.setAttribute(
                    "aria-labelledby",
                    "contract-success-title"
                );

                // Força o navegador a reconhecer o estado inicial.
                void telaSucesso.offsetWidth;

                telaSucesso.classList.add("is-animated");
                fecharSucesso.focus();
            }

            fecharSucesso.addEventListener("click", () => {
                modal.close();
            });

            modal.addEventListener("close", mostrarFormulario);


            /* ========================================
               6. MENSAGENS DE STATUS
            ======================================== */

            // Mensagem de status acessível, criada sem alterar o HTML.
            let feedback = form.querySelector("#contract-feedback");

            if (!feedback) {
                feedback = document.createElement("p");

                feedback.id = "contract-feedback";
                feedback.setAttribute("role", "status");
                feedback.setAttribute("aria-live", "polite");

                feedback.style.marginTop = "12px";
                feedback.style.fontSize = "13px";
                feedback.style.lineHeight = "1.5";

                form.appendChild(feedback);
            }

            function atualizarFeedback(
                mensagem,
                cor = "#24385e"
            ) {
                feedback.textContent = mensagem;
                feedback.style.color = cor;
            }

            /* ========================================
                RENOVAR VERIFICAÇÃO CLOUDFLARE
            ======================================== */

            function renovarTurnstile() 
            {

                if (window.turnstile && typeof window.turnstile.reset === "function") 
                {
                    try {window.turnstile.reset();} 
                    catch (erro) {console.warn("Não foi possível renovar o Turnstile.", erro); }
                }

            }



            /* ========================================
               7. ABERTURA E FECHAMENTO DO MODAL
            ======================================== */

            // Todos os botões abrem o mesmo formulário.
            openButtons.forEach(botao => {
                botao.addEventListener("click", event => {
                    event.preventDefault();

                    if (enviando) return;

                    const card = botao.closest(".usage-card");

                    // Apenas o card central pode iniciar contratação.
                    if (
                        card &&
                        !card.classList.contains("is-active")
                    ) {
                        return;
                    }

                    creditoSelecionado = card
                        ? (
                            card.querySelector("h3")
                                ?.textContent.trim() || ""
                        )
                        : "";

                    mostrarFormulario();
                    form.reset();

                    nomeInput.setCustomValidity("");
                    telefoneInput.setCustomValidity("");
                    atualizarFeedback("");

                    if (!modal.open) {
                        modal.showModal();
                    }
                    
                    // Gerar uma nova verificação ao abrir o formulário.
                    renovarTurnstile();
                    nomeInput.focus();

                    nomeInput.focus();
                });
            });

            closeButton.addEventListener("click", () => {
                if (!enviando) {
                    modal.close();
                }
            });

            modal.addEventListener("click", event => {
                if (!enviando && event.target === modal) {
                    modal.close();
                }
            });

            // Evita fechar o formulário durante o envio com a tecla ESC.
            modal.addEventListener("cancel", event => {
                if (enviando) {
                    event.preventDefault();
                }
            });


            /* ========================================
               8. MÁSCARA AUTOMÁTICA DE TELEFONE
            ======================================== */

            // Máscara: (48) 98506-7574 ou (48) 3333-4444.
            telefoneInput.addEventListener("input", () => {
                let numero = telefoneInput.value
                    .replace(/\D/g, "")
                    .slice(0, 11);

                if (numero.length > 6) {
                    const prefixo = numero.length > 10 ? 7 : 6;

                    numero =
                        `(${numero.slice(0, 2)}) ` +
                        `${numero.slice(2, prefixo)}-${numero.slice(prefixo)}`;

                } else if (numero.length > 2) {
                    numero = `(${numero.slice(0, 2)}) ${numero.slice(2)}`;

                } else if (numero.length > 0) {
                    numero = `(${numero}`;
                }

                telefoneInput.value = numero;
                telefoneInput.setCustomValidity("");
            });

            nomeInput.addEventListener("input", () => {
                nomeInput.setCustomValidity("");
            });


            /* ========================================
               9. ENVIAR FORMULÁRIO PARA A ONE360
            ======================================== */

            form.addEventListener("submit", async event => {
                event.preventDefault();

                if (enviando) return;

                const nome = nomeInput.value.trim();
                const telefone = telefoneInput.value.trim();
                const email = emailInput.value.trim();

                const telefoneNumeros = telefone.replace(/\D/g, "");

                nomeInput.setCustomValidity("");
                telefoneInput.setCustomValidity("");

                // Validar nome.
                if (nome.length < 2) {
                    nomeInput.setCustomValidity(
                        "Informe seu nome com pelo menos 2 caracteres."
                    );

                    nomeInput.reportValidity();
                    return;
                }

                // Validar telefone.
                if (!/^\d{10,11}$/.test(telefoneNumeros)) {
                    telefoneInput.setCustomValidity(
                        "Informe um telefone com DDD, contendo 10 ou 11 dígitos."
                    );

                    telefoneInput.reportValidity();
                    return;
                }

                // Inclui a validação do input type="email" no HTML.
                if (!form.reportValidity()) {
                    return;
                }

                /* ========================================
                   VALIDAR TOKEN DO CLOUDFLARE TURNSTILE
                ======================================== */

                const turnstileToken = form.querySelector(
                    'input[name="cf-turnstile-response"]'
                )?.value;

                if (!turnstileToken) {
                    atualizarFeedback(
                        "Aguarde a verificação de segurança e tente novamente.",
                        "#c62828"
                    );
                    return;
                }

                // Prepara o áudio ainda durante o clique do usuário.
                prepararSomConfirmacao();

                /* ========================================
                   ESTADO DE ENVIO
                ======================================== */

                enviando = true;

                botaoEnviar.disabled = true;
                botaoEnviar.textContent = "Enviando...";

                closeButton.disabled = true;

                form.setAttribute("aria-busy", "true");

                atualizarFeedback(
                    "Registrando seu interesse na nossa plataforma..."
                );

                try {
                    /* ========================================
                       REQUISIÇÃO AO NOSSO SERVIDOR
                    ======================================== */

                    // API local do server.js, sem expor a chave da One360.
                    const resposta = await fetch("/api/leads", {

                        method: "POST",

                        headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },

                    body: JSON.stringify({
                        name: nome,
                        phone: telefone,
                        email: email,
                        credit: creditoSelecionado,
                        turnstileToken: turnstileToken
                    }),

                        signal: AbortSignal.timeout(25000)
                    });

                    const resultado = await resposta.json()
                        .catch(() => null);

                    /* ========================================
                       VERIFICAR CRIAÇÃO DA OPORTUNIDADE
                    ======================================== */

                    if (
                        !resposta.ok ||
                        resultado?.success !== true
                    ) {
                        throw new Error(
                            "Não foi possível confirmar a criação da oportunidade."
                        );
                    }

                    /* ========================================
                       MOSTRAR AGRADECIMENTO
                    ======================================== */

                    // Sem redirecionamento para o WhatsApp.
                    atualizarFeedback("");

                    mostrarAgradecimento();
                    tocarSomConfirmacao();

                } catch (erro) {
                    /* ========================================
                       TRATAMENTO DE ERROS
                    ======================================== */

                    console.error(
                        "Não foi possível confirmar o envio do lead:",
                        erro
                    );

                    atualizarFeedback(
                        "Não foi possível confirmar seu cadastro. " +
                        "Aguarde um instante antes de tentar novamente " +
                        "ou entre em contato com nossa equipe.",
                        "#c62828"
                    );

                } finally {
                    /* ========================================
                       RESTAURAR FORMULÁRIO
                    ======================================== */

                    enviando = false;

                    botaoEnviar.disabled = false;
                    botaoEnviar.innerHTML = htmlOriginalBotao;

                    closeButton.disabled = false;

                    form.removeAttribute("aria-busy");
                }
            });
        }
    }
});
