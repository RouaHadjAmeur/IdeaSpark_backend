import { Injectable } from '@nestjs/common';

export interface TrendingHashtag {
  name: string;
  views?: string;
  trend?: 'up' | 'down' | 'stable';
  category: string;
  platform: string;
}

@Injectable()
export class TrendingHashtagsService {
  private cache: Map<string, { data: TrendingHashtag[]; timestamp: number }> = new Map();
  private CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures

  // Hashtags statiques par catégorie (fallback)
  private staticHashtags: Record<string, string[]> = {
    cosmetics: [
      '#makeup', '#beauty', '#skincare', '#cosmetics', '#makeuptutorial',
      '#beautytips', '#glowup', '#selfcare', '#beautyblogger', '#makeuplover',
      '#skincareroutine', '#beautycommunity', '#makeupoftheday', '#beautyaddict',
      '#makeupjunkie', '#beautyproducts', '#makeupartist', '#beautycare',
    ],
    beauty: [
      '#beauty', '#spa', '#wellness', '#massage', '#salon',
      '#beautysalon', '#skincare', '#facial', '#beautytherapy', '#relaxation',
      '#selfcare', '#beautytreatment', '#glowingskin', '#beautyroutine',
    ],
    sports: [
      '#fitness', '#workout', '#gym', '#training', '#fitnessmotivation',
      '#sport', '#athlete', '#exercise', '#fitfam', '#gymlife',
      '#fitnessjourney', '#workoutmotivation', '#fitnessgirl', '#sportlife',
      '#running', '#cardio', '#strength', '#healthylifestyle',
    ],
    fashion: [
      '#fashion', '#style', '#ootd', '#fashionblogger', '#fashionista',
      '#outfitoftheday', '#fashionstyle', '#instafashion', '#streetstyle',
      '#fashionable', '#fashionweek', '#styleinspo', '#fashionlover',
      '#trendy', '#fashionaddict', '#stylish', '#fashiongram',
    ],
    food: [
      '#food', '#foodie', '#foodporn', '#instafood', '#foodblogger',
      '#yummy', '#delicious', '#foodphotography', '#foodstagram',
      '#foodlover', '#cooking', '#recipe', '#homemade', '#tasty',
      '#foodgasm', '#foodheaven', '#foodoftheday', '#foodlove',
    ],
    technology: [
      '#tech', '#technology', '#innovation', '#gadgets', '#techie',
      '#smartphone', '#coding', '#programming', '#developer', '#ai',
      '#machinelearning', '#startup', '#digital', '#future',
      '#software', '#techtrends', '#innovation', '#techworld',
    ],
    lifestyle: [
      '#lifestyle', '#life', '#instagood', '#photooftheday', '#love',
      '#happy', '#motivation', '#inspiration', '#goals', '#success',
      '#positivevibes', '#mindset', '#wellness', '#selfimprovement',
      '#dailylife', '#lifestyleblogger', '#goodvibes', '#blessed',
    ],
  };

  /**
   * Récupérer les hashtags tendances pour une catégorie
   */
  async getTrendingHashtags(
    category: string,
    platform: string = 'instagram',
    country: string = 'FR',
  ): Promise<TrendingHashtag[]> {
    const cacheKey = `${category}_${platform}_${country}`;

    // Vérifier le cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`[TrendingHashtags] Cache hit: ${cacheKey}`);
      return cached.data;
    }

    console.log(`[TrendingHashtags] Fetching fresh data: ${cacheKey}`);

    // Pour l'instant, utiliser les hashtags statiques
    const hashtags = this.getStaticHashtags(category, platform);

    // Mettre en cache
    this.cache.set(cacheKey, {
      data: hashtags,
      timestamp: Date.now(),
    });

    return hashtags;
  }

  /**
   * Récupérer les hashtags statiques par catégorie
   */
  private getStaticHashtags(
    category: string,
    platform: string,
  ): TrendingHashtag[] {
    const hashtags = this.staticHashtags[category] || this.staticHashtags['lifestyle'];

    return hashtags.map((name) => ({
      name,
      category,
      platform,
      trend: 'stable',
    }));
  }

  /**
   * Générer des hashtags pour un post spécifique
   */
  async generateHashtagsForPost(
    brandName: string,
    postTitle: string,
    category: string,
    platform: string = 'instagram',
  ): Promise<string[]> {
    console.log(`[TrendingHashtags] Generating hashtags for: ${brandName} - ${postTitle}`);

    // Récupérer les hashtags tendances
    const trending = await this.getTrendingHashtags(category, platform);

    // Sélectionner les 10 meilleurs hashtags
    const selectedHashtags = trending.slice(0, 10).map((h) => h.name);

    // Ajouter des hashtags spécifiques à la marque
    const brandHashtag = `#${brandName.toLowerCase().replace(/\s+/g, '')}`;
    if (!selectedHashtags.includes(brandHashtag)) {
      selectedHashtags.push(brandHashtag);
    }

    // Ajouter des hashtags basés sur le titre du post
    const titleWords = postTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(' ')
      .filter((word) => word.length > 4);

    titleWords.slice(0, 2).forEach((word) => {
      const hashtag = `#${word}`;
      if (!selectedHashtags.includes(hashtag)) {
        selectedHashtags.push(hashtag);
      }
    });

    console.log(`[TrendingHashtags] Generated ${selectedHashtags.length} hashtags`);
    return selectedHashtags;
  }

  /**
   * Nettoyer le cache (optionnel, pour maintenance)
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[TrendingHashtags] Cache cleared');
  }
}
