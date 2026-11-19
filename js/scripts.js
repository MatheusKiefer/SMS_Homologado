
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
            // A quantidade é detectada automaticamente (atualmente 7 cards).
            const totalCards = cards.length;
            let activeIndex = cards.findIndex(card =>
                card.classList.contains("is-active")
            );

            if (activeIndex === -1) activeIndex = 0;

            function updateCarousel() {
                cards.forEach((card, index) => {
                    let offset = index - activeIndex;

                    // Mantém o carrossel circular.
                    if (offset > totalCards / 2) offset -= totalCards;
                    if (offset < -totalCards / 2) offset += totalCards;

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

                    // O botão WhatsApp só pode ser utilizado no card central.
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


    /* ========================================
       3. BOTÃO VOLTAR AO TOPO
    ======================================== */

    const backToTop = document.querySelector(".back-to-top");
    const header = document.querySelector(".site-header");

    if (backToTop && header) {
        const observer = new IntersectionObserver(entries => {
            backToTop.hidden = entries[0].isIntersecting;
        }, { threshold: 0 });

        observer.observe(header);

        backToTop.addEventListener("click", () => {
            const reducedMotion = window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches;

            window.scrollTo({
                top: 0,
                behavior: reducedMotion ? "instant" : "smooth"
            });
        });
    }


    /* ========================================
       4. MODAL DE CONTRATAÇÃO + WHATSAPP
    ======================================== */

    const modal = document.querySelector("#contract-modal");
    const closeButton = document.querySelector(".contract-close");
    const form = document.querySelector("#contract-form");

    // Seletor inclui o cabeçalho, os cards e o botão após o carrossel.
    // .btn-quote também cobre o cabeçalho caso ele ainda seja um <a>.
    const openButtons = document.querySelectorAll(
        "#open-contract-modal, .btn-quote, .usage-whatsapp, .usage-btn"
    );

    if (modal && closeButton && form) {
        // Quando definido, utilize somente números com DDI e DDD.
        // Exemplo: "5548999999999".
        const numeroWhatsapp = "";

        const nomeInput = form.querySelector("#contract-name");
        const telefoneInput = form.querySelector("#contract-phone");
        const emailInput = form.querySelector("#contract-email");

        if (nomeInput && telefoneInput && emailInput) {
            let creditoSelecionado = "";

            // Qualquer um dos três tipos de botão abre o mesmo modal.
            openButtons.forEach(botao => {
                botao.addEventListener("click", event => {
                    event.preventDefault();

                    const card = botao.closest(".usage-card");
                    // Só recebe crédito quando o clique veio do card ativo.
                    if (card && !card.classList.contains("is-active")) {
                        return;
                    }

                    creditoSelecionado = card
                        ? (card.querySelector("h3")?.textContent.trim() || "")
                        : "";

                    // Evita manter dados antigos ao iniciar um novo contato.
                    form.reset();
                    nomeInput.setCustomValidity("");
                    telefoneInput.setCustomValidity("");

                    if (!modal.open) modal.showModal();
                    nomeInput.focus();
                });
            });

            closeButton.addEventListener("click", () => modal.close());

            modal.addEventListener("click", event => {
                if (event.target === modal) modal.close();
            });

            // Máscara automática: (48) 98506-7574 ou (48) 3333-4444.
            telefoneInput.addEventListener("input", () => {
                let numero = telefoneInput.value.replace(/\D/g, "").slice(0, 11);

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

            form.addEventListener("submit", event => {
                event.preventDefault();

                const nome = nomeInput.value.trim();
                const telefone = telefoneInput.value.trim();
                const email = emailInput.value.trim();
                const telefoneNumeros = telefone.replace(/\D/g, "");

                if (!nome) {
                    nomeInput.setCustomValidity("Por favor, informe seu nome.");
                    nomeInput.reportValidity();
                    return;
                }

                if (!/^\d{10,11}$/.test(telefoneNumeros)) {
                    telefoneInput.setCustomValidity(
                        "Informe um telefone com DDD, contendo 10 ou 11 dígitos."
                    );
                    telefoneInput.reportValidity();
                    return;
                }

                // O e-mail é validado pelo input type="email" no HTML.
                const mensagem = [
                    "Olá! Gostaria de saber mais sobre os serviços da SMS Homologado.",
                    "",
                    ...(creditoSelecionado
                        ? [`*Exemplo de uso de interesse:* ${creditoSelecionado}`, ""]
                        : []),
                    "*Dados para contato:*",
                    "",
                    `*Nome:* ${nome}`,
                    `*Telefone:* ${telefone}`,
                    `*E-mail:* ${email}`,
                    "",
                    "Poderiam me orientar sobre a contratação?"
                ].join("\n");

                const mensagemCodificada = encodeURIComponent(mensagem);
                const linkWhatsapp = numeroWhatsapp
                    ? `https://wa.me/${numeroWhatsapp}?text=${mensagemCodificada}`
                    : `https://wa.me/?text=${mensagemCodificada}`;

                modal.close();
                window.location.assign(linkWhatsapp);
            });
        }
    }
});
