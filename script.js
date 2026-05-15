const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navMenu = document.querySelector("[data-nav-menu]");
const yearTarget = document.querySelector("[data-year]");
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-links a");
const revealItems = document.querySelectorAll(".reveal");
const interactiveCards = document.querySelectorAll(".project-card, .portrait-card");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (yearTarget) {
    yearTarget.textContent = new Date().getFullYear();
}

if (header) {
    const updateHeader = () => {
        header.classList.toggle("is-scrolled", window.scrollY > 8);
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
}

if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
        const isOpen = navMenu.classList.toggle("is-open");
        navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navMenu.addEventListener("click", (event) => {
        if (event.target instanceof HTMLAnchorElement) {
            navMenu.classList.remove("is-open");
            navToggle.setAttribute("aria-expanded", "false");
        }
    });
}

if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    revealItems.forEach((item) => revealObserver.observe(item));

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            navLinks.forEach((link) => {
                link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
            });
        });
    }, { rootMargin: "-35% 0px -55% 0px" });

    sections.forEach((section) => sectionObserver.observe(section));
} else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
}

if (!reducedMotion) {
    interactiveCards.forEach((card) => {
        card.addEventListener("pointermove", (event) => {
            const rect = card.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const xPercent = (x / rect.width) * 100;
            const yPercent = (y / rect.height) * 100;
            const tiltX = ((xPercent - 50) / 50) * 4;
            const tiltY = -((yPercent - 50) / 50) * 4;

            card.style.setProperty("--spot-x", `${xPercent}%`);
            card.style.setProperty("--spot-y", `${yPercent}%`);
            card.style.setProperty("--tilt-x", `${tiltX}deg`);
            card.style.setProperty("--tilt-y", `${tiltY}deg`);
        });

        card.addEventListener("pointerleave", () => {
            card.style.removeProperty("--tilt-x");
            card.style.removeProperty("--tilt-y");
        });
    });
}
