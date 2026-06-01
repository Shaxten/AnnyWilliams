import { Component, OnInit, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements AfterViewInit {

  services = [
    {
      icon: '🗣️',
      title: 'Stimulation du langage',
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
