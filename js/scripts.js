
document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (menuToggle && navLinks) {
        const toggleMenu = open => {
            navLinks.classList.toggle("is-open", open);
            menuToggle.setAttribute("aria-expanded", String(open));
            menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
        };

        menuToggle.addEventListener("click", () => {
            toggleMenu(menuToggle.getAttribute("aria-expanded") !== "true");
        });

        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => toggleMenu(false));
        });

        document.addEventListener("keydown", event => {
            if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
                toggleMenu(false);
                menuToggle.focus();
            }
        });

        window.matchMedia("(min-width: 901px)").addEventListener("change", event => {
            if (event.matches) toggleMenu(false);
        });
    }

    const carousel = document.querySelector(".usage-carousel");

    if (carousel) {
        const cards = Array.from(carousel.querySelectorAll(".usage-card"));
        const prevButton = carousel.querySelector(".usage-prev");
        const nextButton = carousel.querySelector(".usage-next");
        const stage = carousel.querySelector(".usage-stage");
        const counter = document.querySelector(".usage-counter");

        if (cards.length && prevButton && nextButton && stage) {
            const totalCards = cards.length;
            let activeIndex = 0;

            const updateCarousel = () => {
                cards.forEach((card, index) => {
                    let offset = index - activeIndex;
                    if (offset > totalCards / 2) offset -= totalCards;
                    if (offset < -totalCards / 2) offset += totalCards;

                    const distance = Math.abs(offset);
                    const isActive = index === activeIndex;

                    card.style.setProperty("--offset", offset);
                    card.style.setProperty("--distance", distance);
                    card.classList.toggle("is-active", isActive);

                    if (isActive) card.setAttribute("aria-current", "true");
                    else card.removeAttribute("aria-current");

                    const cardButton = card.querySelector(".usage-whatsapp");
                    if (cardButton) {
                        cardButton.tabIndex = isActive ? 0 : -1;
                        cardButton.style.pointerEvents = isActive ? "auto" : "none";
                    }
                });

                if (counter) counter.textContent = `${activeIndex + 1} de ${totalCards}`;
            };

            const selectCard = index => {
                activeIndex = ((index % totalCards) + totalCards) % totalCards;
                updateCarousel();
            };

            nextButton.addEventListener("click", () => selectCard(activeIndex + 1));
            prevButton.addEventListener("click", () => selectCard(activeIndex - 1));

            carousel.addEventListener("keydown", event => {
                if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                    event.preventDefault();
                    selectCard(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
                }
            });

            let touchStartX = null;
            let touchStartY = null;

            stage.addEventListener("touchstart", event => {
                if (event.touches.length !== 1) return;
                touchStartX = event.touches[0].clientX;
                touchStartY = event.touches[0].clientY;
            }, { passive: true });

            stage.addEventListener("touchend", event => {
                if (touchStartX === null || touchStartY === null || !event.changedTouches.length) return;

                const differenceX = touchStartX - event.changedTouches[0].clientX;
                const differenceY = touchStartY - event.changedTouches[0].clientY;

                if (Math.abs(differenceX) > 45 && Math.abs(differenceX) > Math.abs(differenceY)) {
                    selectCard(activeIndex + (differenceX > 0 ? 1 : -1));
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

    const voltarInicio = document.querySelector(".footer-back-link");

    if (voltarInicio) {
        voltarInicio.addEventListener("click", event => {
            event.preventDefault();
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
            });
        });
    }

    const modal = document.querySelector("#contract-modal");
    const closeButton = document.querySelector(".contract-close");
    const form = document.querySelector("#contract-form");

    if (!modal || !closeButton || !form) return;

    const nomeInput = form.querySelector("#contract-name");
    const telefoneInput = form.querySelector("#contract-phone");
    const emailInput = form.querySelector("#contract-email");
    const botaoEnviar = form.querySelector('button[type="submit"]');

    if (!nomeInput || !telefoneInput || !emailInput || !botaoEnviar) return;

    const openButtons = document.querySelectorAll(
        "#open-contract-modal, .btn-quote, .usage-whatsapp, .usage-btn"
    );
    const htmlOriginalBotao = botaoEnviar.innerHTML;
    const tituloOriginalModal = modal.getAttribute("aria-labelledby");
    const SOM_CONFIRMACAO_ATIVO = true;

    let creditoSelecionado = "";
    let enviando = false;
    let contextoAudioConfirmacao = null;

    const prepararSomConfirmacao = () => {
        if (!SOM_CONFIRMACAO_ATIVO) return;

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;

        try {
            if (!contextoAudioConfirmacao) contextoAudioConfirmacao = new AudioContextClass();
            if (contextoAudioConfirmacao.state === "suspended") {
                contextoAudioConfirmacao.resume().catch(() => {});
            }
        } catch (_) {}
    };

    const tocarSomConfirmacao = () => {
        const audio = contextoAudioConfirmacao;
        if (!SOM_CONFIRMACAO_ATIVO || !audio || audio.state !== "running") return;

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
                oscilador.frequency.setValueAtTime(nota.frequencia, quando);
                volume.gain.setValueAtTime(0.0001, quando);
                volume.gain.exponentialRampToValueAtTime(0.10, quando + 0.025);
                volume.gain.exponentialRampToValueAtTime(0.0001, quando + nota.duracao);

                oscilador.connect(volume);
                volume.connect(audio.destination);
                oscilador.start(quando);
                oscilador.stop(quando + nota.duracao + 0.02);
            });
        } catch (_) {}
    };

    const telaSucesso = document.createElement("section");
    telaSucesso.className = "contract-success";
    telaSucesso.hidden = true;
    telaSucesso.setAttribute("aria-labelledby", "contract-success-title");
    telaSucesso.setAttribute("aria-live", "polite");
    telaSucesso.innerHTML = `
        <div class="contract-success-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6 9 17l-5-5" pathLength="100"></path>
            </svg>
            <span class="contract-success-sparkle sparkle-1"></span>
            <span class="contract-success-sparkle sparkle-2"></span>
            <span class="contract-success-sparkle sparkle-3"></span>
            <span class="contract-success-sparkle sparkle-4"></span>
            <span class="contract-success-sparkle sparkle-5"></span>
        </div>
        <h2 id="contract-success-title">Solicitação recebida!</h2>
        <p>Obrigado por compartilhar suas informações.</p>
        <p>Em breve, um de nossos especialistas entrará em contato com você.</p>
        <button type="button" class="contract-success-close">Fechar</button>
    `;
    modal.appendChild(telaSucesso);

    const fecharSucesso = telaSucesso.querySelector(".contract-success-close");

    const mostrarFormulario = () => {
        telaSucesso.classList.remove("is-animated");
        telaSucesso.hidden = true;
        form.hidden = false;

        if (tituloOriginalModal) modal.setAttribute("aria-labelledby", tituloOriginalModal);
        else modal.removeAttribute("aria-labelledby");
    };

    const mostrarAgradecimento = () => {
        telaSucesso.classList.remove("is-animated");
        form.hidden = true;
        telaSucesso.hidden = false;
        modal.setAttribute("aria-labelledby", "contract-success-title");
        void telaSucesso.offsetWidth;
        telaSucesso.classList.add("is-animated");
        fecharSucesso.focus();
    };

    fecharSucesso.addEventListener("click", () => modal.close());
    modal.addEventListener("close", mostrarFormulario);

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

    const atualizarFeedback = (mensagem, cor = "#24385e") => {
        feedback.textContent = mensagem;
        feedback.style.color = cor;
    };

    const renovarTurnstile = () => {
        if (window.turnstile && typeof window.turnstile.reset === "function") {
            try {
                window.turnstile.reset();
            } catch (erro) {
                console.warn("Não foi possível renovar o Turnstile.", erro);
            }
        }
    };

    openButtons.forEach(botao => {
        botao.addEventListener("click", event => {
            event.preventDefault();
            if (enviando) return;

            const card = botao.closest(".usage-card");
            if (card && !card.classList.contains("is-active")) return;

            creditoSelecionado = card ? card.querySelector("h3")?.textContent.trim() || "" : "";
            mostrarFormulario();
            form.reset();
            nomeInput.setCustomValidity("");
            telefoneInput.setCustomValidity("");
            atualizarFeedback("");

            if (!modal.open) modal.showModal();
            renovarTurnstile();
            nomeInput.focus();
        });
    });

    closeButton.addEventListener("click", () => {
        if (!enviando) modal.close();
    });

    modal.addEventListener("click", event => {
        if (!enviando && event.target === modal) modal.close();
    });

    modal.addEventListener("cancel", event => {
        if (enviando) event.preventDefault();
    });

    telefoneInput.addEventListener("input", () => {
        let numero = telefoneInput.value.replace(/\D/g, "").slice(0, 11);

        if (numero.length > 6) {
            const prefixo = numero.length > 10 ? 7 : 6;
            numero = `(${numero.slice(0, 2)}) ${numero.slice(2, prefixo)}-${numero.slice(prefixo)}`;
        } else if (numero.length > 2) {
            numero = `(${numero.slice(0, 2)}) ${numero.slice(2)}`;
        } else if (numero.length) {
            numero = `(${numero}`;
        }

        telefoneInput.value = numero;
        telefoneInput.setCustomValidity("");
    });

    nomeInput.addEventListener("input", () => nomeInput.setCustomValidity(""));

    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (enviando) return;

        const nome = nomeInput.value.trim();
        const telefone = telefoneInput.value.trim();
        const email = emailInput.value.trim();
        const telefoneNumeros = telefone.replace(/\D/g, "");

        nomeInput.setCustomValidity("");
        telefoneInput.setCustomValidity("");

        if (nome.length < 2) {
            nomeInput.setCustomValidity("Informe seu nome com pelo menos 2 caracteres.");
            nomeInput.reportValidity();
            return;
        }

        if (!/^\d{10,11}$/.test(telefoneNumeros)) {
            telefoneInput.setCustomValidity("Informe um telefone com DDD, contendo 10 ou 11 dígitos.");
            telefoneInput.reportValidity();
            return;
        }

        if (!form.reportValidity()) return;

        const turnstileToken = form.querySelector('input[name="cf-turnstile-response"]')?.value;

        if (!turnstileToken) {
            atualizarFeedback("Aguarde a verificação de segurança e tente novamente.", "#c62828");
            return;
        }

        prepararSomConfirmacao();
        enviando = true;
        botaoEnviar.disabled = true;
        botaoEnviar.textContent = "Enviando...";
        closeButton.disabled = true;
        form.setAttribute("aria-busy", "true");
        atualizarFeedback("Registrando seu interesse na nossa plataforma...");

        try {
            const resposta = await fetch("/api/leads", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    name: nome,
                    phone: telefone,
                    email,
                    credit: creditoSelecionado,
                    turnstileToken
                }),
                signal: AbortSignal.timeout(25000)
            });

            const resultado = await resposta.json().catch(() => null);

            if (!resposta.ok || resultado?.success !== true) {
                throw new Error("Não foi possível confirmar a criação da oportunidade.");
            }

            atualizarFeedback("");
            mostrarAgradecimento();
            tocarSomConfirmacao();
        } catch (erro) {
            console.error("Não foi possível confirmar o envio do lead:", erro);
            renovarTurnstile();
            atualizarFeedback(
                "Não foi possível confirmar seu cadastro. Aguarde um instante antes de tentar novamente ou entre em contato com nossa equipe.",
                "#c62828"
            );
        } finally {
            enviando = false;
            botaoEnviar.disabled = false;
            botaoEnviar.innerHTML = htmlOriginalBotao;
            closeButton.disabled = false;
            form.removeAttribute("aria-busy");
        }
    });
});
