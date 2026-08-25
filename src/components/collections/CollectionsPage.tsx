import React, { useState } from 'react';
import { COLLECTIONS } from '../../data/collections';
import { Collection } from '../../types';
import { CollectionsHero } from './CollectionsHero';
import { EditorialIntro } from './EditorialIntro';
import { CollectionIndex } from './CollectionIndex';
import { EverydaySection } from './EverydaySection';
import { AfterDarkSection } from './AfterDarkSection';
import { EssentialsSection } from './EssentialsSection';
import { TheDropSection } from './TheDropSection';
import { FeaturedCollectionSection } from './FeaturedCollectionSection';
import { CollectionArchiveSection } from './CollectionArchiveSection';
import { LookbookBridgeSection } from './LookbookBridgeSection';
import { FinalCtaSection } from './FinalCtaSection';
import { CollectionDetailPage } from './CollectionDetailPage';
import { NewsletterSection } from '../NewsletterSection';

interface CollectionsPageProps {
  onNavigateSection: (sectionId: string) => void;
  onSelectPage: (page: 'men' | 'women' | 'new' | 'collections' | 'lookbook' | 'home') => void;
}

export const CollectionsPage: React.FC<CollectionsPageProps> = ({ onNavigateSection, onSelectPage }) => {
  const [selectedDetailCollection, setSelectedDetailCollection] = useState<Collection | null>(null);

  const handleExploreHero = () => {
    const el = document.getElementById('editorial-intro');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenLookbook = () => {
    onSelectPage('lookbook');
  };

  const handleShopAll = () => {
    onSelectPage('men');
  };

  const everydayCol = COLLECTIONS.find((c) => c.slug === 'the-everyday') || COLLECTIONS[0];
  const afterDarkCol = COLLECTIONS.find((c) => c.slug === 'after-dark') || COLLECTIONS[1];
  const essentialsCol = COLLECTIONS.find((c) => c.slug === 'essentials') || COLLECTIONS[2];
  const dropCol = COLLECTIONS.find((c) => c.slug === 'the-drop') || COLLECTIONS[3];
  const featuredCol = COLLECTIONS.find((c) => c.slug === 'featured-next-chapter') || COLLECTIONS[4];

  if (selectedDetailCollection) {
    return (
      <CollectionDetailPage
        collection={selectedDetailCollection}
        onBackToCollections={() => setSelectedDetailCollection(null)}
        onSelectCollection={(col) => setSelectedDetailCollection(col)}
      />
    );
  }

  return (
    <main id="piercyn-collections-page" className="w-full bg-[#F2F0EB]">
      {/* 01 — COLLECTIONS HERO */}
      <CollectionsHero onExplore={handleExploreHero} />

      {/* 02 — EDITORIAL INTRODUCTION */}
      <EditorialIntro />

      {/* 03 — COLLECTION INDEX */}
      <CollectionIndex onSelectSection={handleSelectSection} />

      {/* 04 — COLLECTION 01: THE EVERYDAY */}
      <EverydaySection
        collection={everydayCol}
        onOpenDetail={(col) => setSelectedDetailCollection(col)}
      />

      {/* 05 — COLLECTION 02: AFTER DARK */}
      <AfterDarkSection
        collection={afterDarkCol}
        onOpenDetail={(col) => setSelectedDetailCollection(col)}
      />

      {/* 06 — COLLECTION 03: ESSENTIALS */}
      <EssentialsSection
        collection={essentialsCol}
        onOpenDetail={(col) => setSelectedDetailCollection(col)}
      />

      {/* 07 — COLLECTION 04: THE DROP */}
      <TheDropSection
        collection={dropCol}
        onOpenDetail={(col) => setSelectedDetailCollection(col)}
      />

      {/* 08 — FEATURED COLLECTION */}
      <FeaturedCollectionSection
        collection={featuredCol}
        onOpenDetail={(col) => setSelectedDetailCollection(col)}
      />

      {/* 09 — COLLECTION ARCHIVE */}
      <CollectionArchiveSection />

      {/* 10 — LOOKBOOK CONNECTION */}
      <LookbookBridgeSection onOpenLookbook={handleOpenLookbook} />

      {/* 11 — FINAL CTA */}
      <FinalCtaSection onShopAll={handleShopAll} />

      {/* 12 — NEWSLETTER */}
      <NewsletterSection />
    </main>
  );
};
