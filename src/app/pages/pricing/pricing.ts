import { Component, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './pricing.html',
  styleUrl: './pricing.scss'
})
export class PricingComponent implements AfterViewInit {
  constructor(private seo: SeoService) {
    this.seo.set({
      title: 'Tarifs — Consultations à partir de 100 $ à Sorel-Tracy',
      description: 'Tarifs transparents pour les services d\'Anny Williams : stimulation du langage, relation d\'aide et connaissance de soi à 100 $ la séance. Région Sorel-Tracy, Québec. Consultations en personne ou en ligne.',
      keywords: 'tarif coach Sorel-Tracy, prix consultation développement personnel, coût stimulation langage enfant, tarif relation aide Québec, prix atelier connaissance soi, consultation 100 dollars Sorel',
      canonical: '/tarifs',
      schema: {
        '@context': 'https://schema.org',
        '@type': 'PriceSpecification',
        price: '100',
        priceCurrency: 'CAD',
        description: 'Tarif par séance de consultation individuelle',
        eligibleQuantity: { '@type': 'QuantitativeValue', value: 1, unitText: 'séance' }
      }
    });
  }
  plans = [
    {
      title: 'Stimulation du langage',
      price: '100',
      unit: '/ séance',
      desc: 'Séance individuelle d\'intervention en langage pour enfant.',
      features: ['Évaluation initiale', 'Plan d\'intervention personnalisé', 'Suivi des progrès', 'Communication avec les parents'],
      cta: 'Réserver',
      highlight: false
    },
    {
      title: 'Connaissance de soi',
      price: '100',
      unit: '/ séance',
      desc: 'Atelier individuel pour adolescent ou adulte.',
      features: ['Séance de 60 minutes', 'Outils pratiques', 'Espace confidentiel', 'Suivi personnalisé'],
      cta: 'Réserver',
      highlight: true
    },
    {
      title: 'Relation d\'aide',
      price: 'Sur demande',
      unit: '',
      desc: 'Accompagnement personnalisé selon vos besoins spécifiques.',
      features: ['Évaluation des besoins', 'Programme adapté', 'Flexibilité horaire', 'Suivi continu'],
      cta: 'Nous contacter',
      highlight: false
    }
  ];

  ngAfterViewInit() {
    if (!('IntersectionObserver' in window)) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.1 });
    setTimeout(() => document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el)), 100);
  }
}
