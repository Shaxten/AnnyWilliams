import { Component, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './about.html',
  styleUrl: './about.scss'
})
export class AboutComponent implements AfterViewInit {
  constructor(private seo: SeoService) {
    this.seo.set({
      title: 'À propos — Anny Williams, Coach & Intervenante à Sorel-Tracy',
      description: 'Découvrez Anny Williams, coach en développement personnel et intervenante en langage à Sorel-Tracy. Approche bienveillante et professionnelle pour vous accompagner vers une meilleure version de vous-même.',
      keywords: 'Anny Williams coach Sorel-Tracy, intervenante langage Sorel, développement personnel Québec, coach bienveillant Sorel-Tracy, accompagnement personnel Montérégie, qui est Anny Williams',
      canonical: '/a-propos',
      ogType: 'profile',
      schema: this.seo.personSchema()
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
