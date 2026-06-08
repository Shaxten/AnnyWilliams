import { Component, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements AfterViewInit {
  constructor(private seo: SeoService) {
    this.seo.set({
      title: 'Coach en développement personnel & Intervenante en langage à Sorel-Tracy',
      description: 'Anny Williams vous accompagne avec bienveillance à Sorel-Tracy. Stimulation du langage pour enfants, relation d\'aide, connaissance de soi pour adolescents et adultes. Prenez rendez-vous dès aujourd\'hui.',
      keywords: 'coach développement personnel Sorel-Tracy, intervenante langage Sorel, stimulation langage enfant, relation aide Sorel-Tracy, connaissance de soi adolescent adulte, coaching Québec, orthophonie Sorel',
      canonical: '/',
      ogType: 'website',
      schema: {
        '@context': 'https://schema.org',
        '@graph': [
          this.seo.localBusinessSchema(),
          this.seo.personSchema(),
          this.seo.faqSchema([
            { q: 'Quels services offre Anny Williams ?', a: 'Anny Williams offre trois services principaux : la stimulation du langage pour les enfants, la relation d\'aide pour les adultes, et des ateliers de connaissance de soi pour les adolescents et adultes.' },
            { q: 'Où se trouvent les services d\'Anny Williams ?', a: 'Anny Williams est basée dans la région de Sorel-Tracy, Québec. Les consultations sont disponibles en personne ou en ligne.' },
            { q: 'Quel est le tarif des consultations ?', a: 'Les consultations débutent à 100 $ par séance. Contactez Anny au 450-899-2529 pour plus d\'informations.' },
            { q: 'Comment prendre rendez-vous avec Anny Williams ?', a: 'Vous pouvez prendre rendez-vous directement en ligne via le calendrier de réservation sur ce site, ou appeler le 450-899-2529.' }
          ])
        ]
      }
    });
  }

  services = [
    {
      icon: '🗣️',
      title: "Stratégie d'intervention en développement du langage au début du site",
      desc: 'Identification des défis langagiers et intervention ciblée selon les objectifs du plan d\'orthophonie.',
      link: '/services'
    },
    {
      icon: '🤝',
      title: 'Relation d\'aide',
      desc: 'Accompagnement bienveillant pour mettre des mots sur vos émotions et cultiver une harmonie avec vous-même.',
      link: '/services'
    },
    {
      icon: '🌱',
      title: 'Connaissance de soi',
      desc: 'Ateliers pour adolescents et adultes — explorer, comprendre et avancer vers plus de clarté et d\'autonomie.',
      link: '/services'
    }
  ];

  ngAfterViewInit() {
    this.initReveal();
  }

  private initReveal() {
    if (!('IntersectionObserver' in window)) return;
    const els = document.querySelectorAll('[data-reveal]');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.1 });

    setTimeout(() => {
      els.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
          el.classList.add('visible');
        } else {
          obs.observe(el);
        }
      });
    }, 100);
  }
}
