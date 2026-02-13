import { VideoLanguage, DurationOption } from './dto/create-video-request.dto';
import { ShotType } from './schemas/video-idea.schema';

interface VideoSceneTemplate {
    startSec: number;
    endSec: number;
    shotType: ShotType;
    description: string;
    onScreenText: string;
    voiceOver: string;
}

export class ContentLibraries {
    static readonly HOOKS: Record<VideoLanguage, string[]> = {
        [VideoLanguage.English]: [
            "Stop scrolling if you want [BENEFIT]!",
            "I found the ultimate hack for [PAIN_POINT]...",
            "Don't buy [PRODUCT_CATEGORY] until you watch this.",
            "This one thing changed my [PAIN_POINT] forever.",
            "3 reasons why you need [PRODUCT_NAME].",
            "If you struggle with [PAIN_POINT], you need to see this.",
            "The secret to [BENEFIT] is finally here.",
            "You won't believe what [PRODUCT_NAME] can do.",
            "Why is nobody talking about [PRODUCT_NAME]?",
            "This is the best investment for [TARGET_AUDIENCE].",
            "Say goodbye to [PAIN_POINT].",
            "Watch me transform my [PAIN_POINT] into [BENEFIT].",
            "Is [PRODUCT_NAME] worth the hype? Let's test it.",
            "This $50 [PRODUCT_CATEGORY] beats the luxury brands.",
            "My morning routine wasn't complete without this.",
            "The number one mistake [TARGET_AUDIENCE] make...",
            "Here is the truth about [PRODUCT_CATEGORY].",
            "Unlock the power of [BENEFIT] with this tool.",
            "I wish I knew about this sooner!",
            "Can [PRODUCT_NAME] really fix [PAIN_POINT]?",
            "Testing the viral [PRODUCT_NAME] from TikTok.",
            "POV: You finally solved [PAIN_POINT].",
            "If you are [TARGET_AUDIENCE], keep watching.",
            "This simple trick saves you hours on [PAIN_POINT].",
            "Top 3 tips for [BENEFIT].",
            "How to get [BENEFIT] in under 5 minutes.",
            "Stop Wasting money on bad [PRODUCT_CATEGORY].",
            "The holy grail of [PRODUCT_CATEGORY] is here.",
            "Do not ignore this if you care about [BENEFIT].",
            "Life hack: Use [PRODUCT_NAME] for [BENEFIT].",
        ],
        [VideoLanguage.French]: [
            "Arrêtez de scroller si vous voulez [BENEFIT] !",
            "J'ai trouvé l'astuce ultime pour [PAIN_POINT]...",
            "N'achetez pas de [PRODUCT_CATEGORY] avant de voir ça.",
            "Cette chose a changé mon [PAIN_POINT] à jamais.",
            "3 raisons pour lesquelles il vous faut [PRODUCT_NAME].",
            "Si vous galérez avec [PAIN_POINT], regardez ça.",
            "Le secret pour [BENEFIT] est enfin là.",
            "Vous ne croirez pas ce que [PRODUCT_NAME] peut faire.",
            "Pourquoi personne ne parle de [PRODUCT_NAME] ?",
            "C'est le meilleur investissement pour les [TARGET_AUDIENCE].",
            "Dites adieu à [PAIN_POINT].",
            "Regardez-moi transformer mon [PAIN_POINT] en [BENEFIT].",
            "[PRODUCT_NAME] vaut-il le coup ? On teste.",
            "Ce [PRODUCT_CATEGORY] à 50€ bat les marques de luxe.",
            "Ma routine n'était pas complète sans ça.",
            "L'erreur n°1 que font les [TARGET_AUDIENCE]...",
            "Voici la vérité sur les [PRODUCT_CATEGORY].",
            "Libérez le pouvoir de [BENEFIT] avec cet outil.",
            "J'aurais aimé connaître ça plus tôt !",
            "[PRODUCT_NAME] peut-il vraiment régler [PAIN_POINT] ?",
            "Je teste le [PRODUCT_NAME] viral de TikTok.",
            "POV : Vous avez enfin résolu [PAIN_POINT].",
            "Si vous êtes [TARGET_AUDIENCE], continuez à regarder.",
            "Cette astuce simple vous sauve des heures sur [PAIN_POINT].",
            "Top 3 conseils pour [BENEFIT].",
            "Comment obtenir [BENEFIT] en moins de 5 minutes.",
            "Arrêtez de gaspiller de l'argent dans de mauvais [PRODUCT_CATEGORY].",
            "Le graal des [PRODUCT_CATEGORY] est ici.",
            "N'ignorez pas ça si vous tenez à [BENEFIT].",
            "Life hack : Utilisez [PRODUCT_NAME] pour [BENEFIT].",
        ],
        [VideoLanguage.Arabic]: [
            "وقف سكرول إذا تحب [BENEFIT]!",
            "لقيت الحل النهائي لـ [PAIN_POINT]...",
            "ما تشريش [PRODUCT_CATEGORY] قبل ما تشوف هذا.",
            "الحاجة هذي بدلتلي [PAIN_POINT] للأبد.",
            "3 أسباب علاش لازمك [PRODUCT_NAME].",
            "إذا تعاني من [PAIN_POINT]، لازم تشوف هذا.",
            "السر لـ [BENEFIT] أخيراً وصل.",
            "ما كش بش تصدق شنوة ينجم يعمل [PRODUCT_NAME].",
            "علاش حد ما يحكي على [PRODUCT_NAME]؟",
            "أحسن استثمار لـ [TARGET_AUDIENCE].",
            "قول وداعاً لـ [PAIN_POINT].",
            "شوف كيفاش حولت [PAIN_POINT] لـ [BENEFIT].",
            "زعما [PRODUCT_NAME] يستاهل الضجة؟ نجربوه.",
            "الـ [PRODUCT_CATEGORY] هذا بـ 50 دينار يغلب الماركات الغالية.",
            "روتيني ما كانش كامل بلاش هذا.",
            "أكبر غلطة يعملوها [TARGET_AUDIENCE]...",
            "هاو الصحيح على [PRODUCT_CATEGORY].",
            "اكتشف قوة [BENEFIT] مع الأداة هذي.",
            "يا ريتني عرفت هذا من قبل!",
            "زعما [PRODUCT_NAME] بالحق يصلح [PAIN_POINT]؟",
            "نجرب في [PRODUCT_NAME] الفيرال متاع تيك توك.",
            "POV: أخيراً حليت مشكلة [PAIN_POINT].",
            "إذا انت من [TARGET_AUDIENCE]، كمل تفرج.",
            "العفسة هذي تربحك برشة وقت في [PAIN_POINT].",
            "أهم 3 نصائح لـ [BENEFIT].",
            "كيفاش تتحصل على [BENEFIT] في أقل من 5 دقايق.",
            "يزي ما تضيع فلوسك في [PRODUCT_CATEGORY] خايب.",
            "أعز كعبات [PRODUCT_CATEGORY] موجودة لهنا.",
            "رد بالك تفلت هذا إذا يهمك [BENEFIT].",
            "حيلة ذكية: استعمل [PRODUCT_NAME] بش تربح [BENEFIT].",
        ],
    };

    static readonly CTAS: Record<VideoLanguage, string[]> = {
        [VideoLanguage.English]: [
            "Click the link in bio to order!",
            "Get yours today at [BRAND_NAME].",
            "Comment 'NEED' and I'll send you the link.",
            "Shop now before it sells out!",
            "Don't miss out, grab yours now.",
            "Visit our website for [OFFER].",
            "Link in bio!",
            "Check it out here!",
            "Follow for more [PRODUCT_CATEGORY] tips.",
            "Tag a friend who needs this.",
            "Save this video for later.",
            "Double tap if you agree!",
            "Share this with a [TARGET_AUDIENCE].",
            "Order now and get [OFFER].",
            "Limited stock available!",
            "Try it risk-free today.",
            "Join the [BRAND_NAME] family.",
            "Hit that follow button!",
            "Ready to upgrade? Link in bio.",
            "Which color would you pick? Comment below.",
        ],
        [VideoLanguage.French]: [
            "Cliquez le lien en bio pour commander !",
            "Prenez le vôtre aujourd'hui chez [BRAND_NAME].",
            "Commentez 'JE VEUX' et je vous envoie le lien.",
            "Achetez maintenant avant la rupture !",
            "Ne ratez pas ça, foncez.",
            "Visitez notre site pour [OFFER].",
            "Lien en bio !",
            "Regardez ça ici !",
            "Abonnez-vous pour plus d'astuces [PRODUCT_CATEGORY].",
            "Taguez un ami qui a besoin de ça.",
            "Enregistrez cette vidéo pour plus tard.",
            "Double tap si vous êtes d'accord !",
            "Partagez ça avec un [TARGET_AUDIENCE].",
            "Commandez et profitez de [OFFER].",
            "Stock limité !",
            "Essayez sans risque aujourd'hui.",
            "Rejoignez la famille [BRAND_NAME].",
            "Appuyez sur s'abonner !",
            "Prêt à changer ? Lien en bio.",
            "Quelle couleur vous préférez ? Dites-le en com.",
        ],
        [VideoLanguage.Arabic]: [
            "اضغط على الرابط في البيو بش تطلب!",
            "خوذ متاعك اليوم من عند [BRAND_NAME].",
            "اكتب 'نحب' في كومنتار نبعثلك الرابط.",
            "اشري توا قبل ما يوفى!",
            "ما تفلتش الفرصة، خوذ كعبتك.",
            "زور موقعنا و تمتع بـ [OFFER].",
            "الرابط في البيو!",
            "شوف اللينك لهنا!",
            "أعمل أبوني لأكثر نصائح [PRODUCT_CATEGORY].",
            "طاغي صاحبك اللي يستحق هذا.",
            "سجل الفيديو بش ترجعلو مبعد.",
            "دوبل كليك كان موافق!",
            "بارتاجي هذا مع [TARGET_AUDIENCE].",
            "كومندي و خوذ [OFFER].",
            "الكمية محدودة!",
            "جرب و متهني.",
            "انضم لعائلة [BRAND_NAME].",
            "انزل على زر المتابعة!",
            "حاضر بش تبدل؟ الرابط في البيو.",
            "أما لون تختار؟ قوللنا في الكومنتار.",
        ],
    };

    static getTemplates(duration: DurationOption): VideoSceneTemplate[] {
        switch (duration) {
            case DurationOption.S15:
                return [
                    { startSec: 0, endSec: 2, shotType: ShotType.ARoll, onScreenText: "[HOOK_TEXT]", voiceOver: "[HOOK]", description: "Catchy opening showing the problem or shock factor." },
                    { startSec: 2, endSec: 5, shotType: ShotType.BRoll, onScreenText: "[PAIN_POINT]", voiceOver: "You know how annoying [PAIN_POINT] is?", description: "Visualizing the frustration." },
                    { startSec: 5, endSec: 12, shotType: ShotType.ProductCloseUp, onScreenText: "Solution: [PRODUCT_NAME]", voiceOver: "Well, [PRODUCT_NAME] fixes that by [BENEFIT].", description: "The product hero shot appearing." },
                    { startSec: 12, endSec: 15, shotType: ShotType.ScreenText, onScreenText: "[OFFER]", voiceOver: "[CTA]", description: "Clear call to action screen." },
                ];
            case DurationOption.S30:
                return [
                    { startSec: 0, endSec: 3, shotType: ShotType.ARoll, onScreenText: "[HOOK_TEXT]", voiceOver: "[HOOK]", description: "Strong hook to grab attention." },
                    { startSec: 3, endSec: 10, shotType: ShotType.BRoll, onScreenText: "Struggling with [PAIN_POINT]?", voiceOver: "I used to struggle with [PAIN_POINT] every single day.", description: "Relatable problem scenario." },
                    { startSec: 10, endSec: 18, shotType: ShotType.Testimonial, onScreenText: "Real Results", voiceOver: "then I found [PRODUCT_NAME]. Look at these results!", description: "Showing proof or user testimonial." },
                    { startSec: 18, endSec: 26, shotType: ShotType.ProductCloseUp, onScreenText: "[BENEFIT]", voiceOver: "It gives you [BENEFIT] without the hassle.", description: "Key benefit demonstration." },
                    { startSec: 26, endSec: 30, shotType: ShotType.ScreenText, onScreenText: "Link in Bio", voiceOver: "[CTA]", description: "Final CTA with urgency." },
                ];
            case DurationOption.S60:
                return [
                    { startSec: 0, endSec: 4, shotType: ShotType.ARoll, onScreenText: "[HOOK_TEXT]", voiceOver: "[HOOK]", description: "Compelling hook." },
                    { startSec: 4, endSec: 20, shotType: ShotType.BRoll, onScreenText: "My Story", voiceOver: "Let me tell you a story about [PAIN_POINT]...", description: "Storytelling segment establishing the problem depth." },
                    { startSec: 20, endSec: 40, shotType: ShotType.ProductCloseUp, onScreenText: "The Fix: [PRODUCT_NAME]", voiceOver: "That's when I discovered [PRODUCT_NAME]. Here is how it works...", description: "Detailed demo of the product features." },
                    { startSec: 40, endSec: 52, shotType: ShotType.Testimonial, onScreenText: "Proof", voiceOver: "It's not just me. Thousands of [TARGET_AUDIENCE] love it.", description: "Social proof/reviews." },
                    { startSec: 52, endSec: 60, shotType: ShotType.ScreenText, onScreenText: "[OFFER]", voiceOver: "So what are you waiting for? [CTA]", description: "Strong closing CTA." },
                ];
            case DurationOption.S90:
                return [
                    { startSec: 0, endSec: 5, shotType: ShotType.ARoll, onScreenText: "[HOOK_TEXT]", voiceOver: "[HOOK]", description: "Long-form hook." },
                    { startSec: 5, endSec: 30, shotType: ShotType.BRoll, onScreenText: "Deep Dive", voiceOver: "I've been dealing with [PAIN_POINT] for years. [Expand on story]...", description: "In-depth storytelling." },
                    { startSec: 30, endSec: 60, shotType: ShotType.ProductCloseUp, onScreenText: "How it works", voiceOver: "Enter [PRODUCT_NAME]. It uses specific technology to [BENEFIT_1]. Plus it helps with [BENEFIT_2].", description: "Comprehensive product demo." },
                    { startSec: 60, endSec: 80, shotType: ShotType.Testimonial, onScreenText: "Community Love", voiceOver: "Don't take my word for it. Here is what others say...", description: "Extended social proof." },
                    { startSec: 80, endSec: 90, shotType: ShotType.ScreenText, onScreenText: "Get Yours", voiceOver: "[CTA] and change your life today.", description: "Final CTA." },
                ];
            default:
                // Default to 15s if unknown
                return ContentLibraries.getTemplates(DurationOption.S15);
        }
    }
}
