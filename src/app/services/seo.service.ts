import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

export interface SeoConfig {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
  schema?: object;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private meta     = inject(Meta);
  private title    = inject(Title);
  private document = inject(DOCUMENT);

  private readonly siteName    = 'Anny Williams — Coach & Intervenante';
  private readonly baseUrl     = 'https://shaxten.github.io/AnnyWilliams';
  private readonly defaultImg  = 'https://shaxten.github.io/AnnyWilliams/assets/og-image.jpg';
  private readonly phone       = '+14508992529';
  private readonly region      = 'Sorel-Tracy, Québec, Canada';

  set(config: SeoConfig) {
    const fullTitle = `${config.title} | ${this.siteName}`;
    const canonical = config.canonical
      ? `${this.baseUrl}${config.canonical}`
      : this.baseUrl;
    const image = config.ogImage ?? this.defaultImg;

    // ── Title ──────────────────────────────────────────────
    this.title.setTitle(fullTitle);

    // ── Standard meta ──────────────────────────────────────
    this.meta.updateTag({ name: 'description',        content: config.description });
    this.meta.updateTag({ name: 'keywords',           content: config.keywords ?? '' });
    this.meta.updateTag({ name: 'author',             content: 'Anny Williams' });
    this.meta.updateTag({ name: 'robots',             content: 'index, follow' });
    this.meta.updateTag({ name: 'language',           content: 'fr-CA' });
    this.meta.updateTag({ name: 'geo.region',         content: 'CA-QC' });
    this.meta.updateTag({ name: 'geo.placename',      content: 'Sorel-Tracy' });

    // ── Open Graph ─────────────────────────────────────────
    this.meta.updateTag({ property: 'og:title',       content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: config.description });
    this.meta.updateTag({ property: 'og:type',        content: config.ogType ?? 'website' });
    this.meta.updateTag({ property: 'og:url',         content: canonical });
    this.meta.updateTag({ property: 'og:image',       content: image });
    this.meta.updateTag({ property: 'og:image:alt',   content: config.title });
    this.meta.updateTag({ property: 'og:site_name',   content: this.siteName });
    this.meta.updateTag({ property: 'og:locale',      content: 'fr_CA' });

    // ── Twitter Card ───────────────────────────────────────
    this.meta.updateTag({ name: 'twitter:card',        content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title',       content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: config.description });
    this.meta.updateTag({ name: 'twitter:image',       content: image });

    // ── Canonical ──────────────────────────────────────────
    this.setCanonical(canonical);

    // ── JSON-LD Schema ─────────────────────────────────────
    if (config.schema) {
      this.setSchema(config.schema);
    }
  }

  private setCanonical(url: string) {
    let link = this.document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private setSchema(schema: object) {
    const id = 'json-ld-schema';
    let script = this.document.getElementById(id);
    if (!script) {
      script = this.document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('id', id);
      this.document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);
  }

  // ── Pre-built schemas ──────────────────────────────────────
  localBusinessSchema() {
    return {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': this.baseUrl,
      name: 'Anny Williams — Coach & Intervenante en langage',
      description: 'Coach en développement personnel et intervenante en langage à Sorel-Tracy. Services de stimulation du langage, relation d\'aide et connaissance de soi pour enfants, adolescents et adultes.',
      url: this.baseUrl,
      telephone: this.phone,
      email: 'anny.williams@email.com',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Sorel-Tracy',
        addressRegion: 'QC',
        addressCountry: 'CA'
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 46.0432,
        longitude: -73.1116
      },
      areaServed: {
        '@type': 'GeoCircle',
        geoMidpoint: {
          '@type': 'GeoCoordinates',
          latitude: 46.0432,
          longitude: -73.1116
        },
        geoRadius: '50000'
      },
      openingHoursSpecification: [
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '09:00', closes: '17:00' }
      ],
      priceRange: '$$',
      currenciesAccepted: 'CAD',
      paymentAccepted: 'Cash, Credit Card',
      sameAs: []
    };
  }

  personSchema() {
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Anny Williams',
      jobTitle: 'Coach en développement personnel et Intervenante en langage',
      description: 'Anny Williams est une coach en développement personnel passionnée par l\'accompagnement des individus à tous les stades de leur vie.',
      url: this.baseUrl,
      telephone: this.phone,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Sorel-Tracy',
        addressRegion: 'Québec',
        addressCountry: 'Canada'
      },
      knowsAbout: [
        'Développement personnel',
        'Intervention en langage',
        'Stimulation du langage',
        'Relation d\'aide',
        'Connaissance de soi',
        'Coaching',
        'Orthophonie'
      ]
    };
  }

  serviceSchema(name: string, description: string, price: string) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name,
      description,
      provider: {
        '@type': 'Person',
        name: 'Anny Williams',
        telephone: this.phone,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Sorel-Tracy',
          addressRegion: 'QC',
          addressCountry: 'CA'
        }
      },
      areaServed: this.region,
      offers: {
        '@type': 'Offer',
        price,
        priceCurrency: 'CAD',
        availability: 'https://schema.org/InStock'
      }
    };
  }

  faqSchema(faqs: Array<{ q: string; a: string }>) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a }
      }))
    };
  }
}
