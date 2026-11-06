import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import FloatingAnimalsHero from '@/Components/ui/FloatingAnimalsHero';
import About from '@/Components/ui/About';

export default function HeroAboutTransition() {
    const intro = useRef<HTMLDivElement>(null);
    const hero = useRef<HTMLDivElement>(null);
    const about = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = intro.current;
        const heroPanel = hero.current;
        const aboutPanel = about.current;
        if (!container || !heroPanel || !aboutPanel) return;

        gsap.registerPlugin(ScrollTrigger);
        const media = gsap.matchMedia();

        media.add('(prefers-reduced-motion: no-preference) and (min-height: 561px)', () => {
            // Pin only the hero. About stays in document flow so its sticky steps,
            // anchor links and touch/keyboard scrolling retain their normal behavior.
            gsap.to(heroPanel.querySelectorAll('.floating-hero-animals, .floating-hero-copy'), {
                // Fade the content without touching the background or the pets' transforms.
                // autoAlpha also hides the links from keyboard navigation once fully faded.
                autoAlpha: 0,
                ease: 'none',
                scrollTrigger: {
                    trigger: container,
                    start: 0,
                    endTrigger: aboutPanel,
                    end: () => {
                        const header = container.closest('.public-shell')?.querySelector('.site-header');
                        return `top ${header?.getBoundingClientRect().height ?? 0}px`;
                    },
                    pin: heroPanel,
                    pinSpacing: false,
                    scrub: true,
                    invalidateOnRefresh: true,
                },
            });
        });

        return () => media.revert();
    }, []);

    return (
        <div ref={intro} className="home-intro">
            <div ref={hero} className="home-hero-stage">
                <FloatingAnimalsHero />
            </div>
            <div ref={about} className="home-about-reveal">
                <About />
            </div>
        </div>
    );
}
