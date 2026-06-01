import { Component, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './services.html',
  styleUrl: './services.scss'
})
export class ServicesComponent implements AfterViewInit {
  constructor(private seo: SeoService) {
    this.seo.set({
      title: 'Services — Stimulation du langage, Relation d\'aide & Connaissance de soi',
      description: 'Découvrez les services personnalisés d\'Anny Williams à Sorel-Tracy : stimulation du langage pour enfants (dépistage, plan d\'intervention), relation d\'aide pour adultes, et ateliers de connaissance de soi pour adolescents et adultes.',
      keywords: 'stimulation langage enfant Sorel-Tracy, dépistage trouble communication, plan intervention orthophonie, relation aide adulte Québec, atelier connaissance soi adolescent, coaching développement personnel Sorel',
      canonical: '/services',
      schema: {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Services d\'Anny Williams',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            item: this.seo.serviceSchema(
              'Stimulation du langage',
              'Identification des défis langagiers, intervention ciblée selon le plan d\'orthophonie, stimulation globale de l\'enfant et dépistage précoce des troubles de la communication.',
              '100'
            )
          },
          {
            '@type': 'ListItem',
            position: 2,
            item: this.seo.serviceSchema(
              'Relation d\'aide',
              'Accompagnement bienveillant pour mettre des mots sur vos émotions, comprendre vos pensées et comportements, et cultiver une harmonie avec vous-même.',
              '100'
            )
          },
          {
            '@type': 'ListItem',
            position: 3,
            item: this.seo.serviceSchema(
              'Connaissance de soi',
              'Ateliers individuels pour adolescents et adultes pour explorer, comprendre et avancer vers plus de clarté, d\'autonomie et de sens.',
              '100'
            )
          }
        ]
      }
    });
  }
  ngAfterViewInit() {
    if (!('IntersectionObserver' in window)) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.1 });
    setTimeout(() => document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el)), 100);
  }
}
