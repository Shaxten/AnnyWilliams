import { Component, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './pricing.html',
  styleUrl: './pricing.scss'
})
export class PricingComponent implements AfterViewInit {
  plans = [
    {
      title: 'Stimulation du langage',
      price: '70',
      unit: '/ séance',
      desc: 'Séance individuelle d\'intervention en langage pour enfant.',
      features: ['Évaluation initiale', 'Plan d\'intervention personnalisé', 'Suivi des progrès', 'Communication avec les parents'],
      cta: 'Réserver',
      highlight: false
    },
    {
      title: 'Connaissance de soi',
      price: '70',
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
