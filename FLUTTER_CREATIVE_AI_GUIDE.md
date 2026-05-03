# 🎨 Guide Flutter - Générateur de Hooks

## � Intégration des 3 Nouveaux Modules

### 1. Score de Performance IA
### 2. Générateur de Hooks Viraux  
### 3. Prédicteur d'Heures Optimales

---

## 🚀 Exemple Complet d'Intégration

### Service API

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class CreativeAIService {
  final String baseUrl = 'http://10.245.240.19:3000';
  final String token;

  CreativeAIService(this.token);

  // 1. ANALYSER UN POST
  Future<PostAnalysis> analyzePost({
    required String caption,
    required List<String> hashtags,
    String? imageUrl,
    DateTime? scheduledTime,
    required String platform,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/post-analyzer/score'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'caption': caption,
        'hashtags': hashtags,
        'imageUrl': imageUrl,
        'scheduledTime': scheduledTime?.toIso8601String(),
        'platform': platform,
      }),
    );

    if (response.statusCode == 201) {
      return PostAnalysis.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Erreur lors de l\'analyse du post');
    }
  }

  // 2. GÉNÉRER DES HOOKS VIRAUX
  Future<List<String>> generateViralHooks({
    required String topic,
    required String platform,
    required String tone,
    int count = 5,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/viral-hooks/generate'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'topic': topic,
        'platform': platform,
        'tone': tone,
        'count': count,
      }),
    );

    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      return List<String>.from(data['hooks']);
    } else {
      throw Exception('Erreur lors de la génération des hooks');
    }
  }

  // 3. OBTENIR LES HEURES OPTIMALES
  Future<OptimalTiming> getOptimalTiming({
    required String platform,
    required String contentType,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/optimal-timing/predict'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'platform': platform,
        'contentType': contentType,
      }),
    );

    if (response.statusCode == 201) {
      return OptimalTiming.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Erreur lors de la prédiction du timing');
    }
  }
}
```

---

## 📊 Modèles de Données

### PostAnalysis

```dart
class PostAnalysis {
  final int overallScore;
  final Map<String, ScoreDetail> scores;
  final List<String> suggestions;
  final String predictedEngagement;

  PostAnalysis({
    required this.overallScore,
    required this.scores,
    required this.suggestions,
    required this.predictedEngagement,
  });

  factory PostAnalysis.fromJson(Map<String, dynamic> json) {
    return PostAnalysis(
      overallScore: json['overallScore'],
      scores: (json['scores'] as Map<String, dynamic>).map(
        (key, value) => MapEntry(key, ScoreDetail.fromJson(value)),
      ),
      suggestions: List<String>.from(json['suggestions']),
      predictedEngagement: json['predictedEngagement'],
    );
  }

  Color get scoreColor {
    if (overallScore >= 90) return Colors.green;
    if (overallScore >= 75) return Colors.lightGreen;
    if (overallScore >= 60) return Colors.orange;
    return Colors.red;
  }

  String get scoreLabel {
    if (overallScore >= 90) return 'Excellent';
    if (overallScore >= 75) return 'Très bon';
    if (overallScore >= 60) return 'Bon';
    if (overallScore >= 40) return 'Moyen';
    return 'Faible';
  }
}

class ScoreDetail {
  final int score;
  final String feedback;

  ScoreDetail({required this.score, required this.feedback});

  factory ScoreDetail.fromJson(Map<String, dynamic> json) {
    return ScoreDetail(
      score: json['score'],
      feedback: json['feedback'],
    );
  }
}
```

### OptimalTiming

```dart
class OptimalTiming {
  final List<TimeSlot> bestTimes;
  final List<TimeSlot> worstTimes;

  OptimalTiming({required this.bestTimes, required this.worstTimes});

  factory OptimalTiming.fromJson(Map<String, dynamic> json) {
    return OptimalTiming(
      bestTimes: (json['bestTimes'] as List)
          .map((e) => TimeSlot.fromJson(e))
          .toList(),
      worstTimes: (json['worstTimes'] as List)
          .map((e) => TimeSlot.fromJson(e))
          .toList(),
    );
  }
}

class TimeSlot {
  final String day;
  final String time;
  final int score;
  final String reason;
  final String? expectedEngagement;

  TimeSlot({
    required this.day,
    required this.time,
    required this.score,
    required this.reason,
    this.expectedEngagement,
  });

  factory TimeSlot.fromJson(Map<String, dynamic> json) {
    return TimeSlot(
      day: json['day'],
      time: json['time'],
      score: json['score'],
      reason: json['reason'],
      expectedEngagement: json['expectedEngagement'],
    );
  }

  String get dayFr {
    const days = {
      'monday': 'Lundi',
      'tuesday': 'Mardi',
      'wednesday': 'Mercredi',
      'thursday': 'Jeudi',
      'friday': 'Vendredi',
      'saturday': 'Samedi',
      'sunday': 'Dimanche',
    };
    return days[day] ?? day;
  }
}
```

---

## 🎨 Widgets UI

### 1. Widget Score de Performance

```dart
class PostScoreCard extends StatelessWidget {
  final PostAnalysis analysis;

  const PostScoreCard({Key? key, required this.analysis}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Score global
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Score du Post',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: analysis.scoreColor,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${analysis.overallScore}/100',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 8),
            Text(
              analysis.scoreLabel,
              style: TextStyle(
                fontSize: 16,
                color: analysis.scoreColor,
                fontWeight: FontWeight.w600,
              ),
            ),
            Divider(height: 24),

            // Détails des scores
            ...analysis.scores.entries.map((entry) {
              return Padding(
                padding: EdgeInsets.only(bottom: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _getScoreLabel(entry.key),
                          style: TextStyle(fontWeight: FontWeight.w600),
                        ),
                        Text(
                          '${entry.value.score}/100',
                          style: TextStyle(
                            color: _getScoreColor(entry.value.score),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 4),
                    LinearProgressIndicator(
                      value: entry.value.score / 100,
                      backgroundColor: Colors.grey[200],
                      color: _getScoreColor(entry.value.score),
                    ),
                    SizedBox(height: 4),
                    Text(
                      entry.value.feedback,
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                  ],
                ),
              );
            }).toList(),

            Divider(height: 24),

            // Suggestions
            Text(
              '💡 Suggestions',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            ...analysis.suggestions.map((suggestion) {
              return Padding(
                padding: EdgeInsets.only(bottom: 8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('• ', style: TextStyle(fontSize: 16)),
                    Expanded(child: Text(suggestion)),
                  ],
                ),
              );
            }).toList(),

            Divider(height: 24),

            // Engagement prédit
            Container(
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _getEngagementColor(analysis.predictedEngagement),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    _getEngagementIcon(analysis.predictedEngagement),
                    color: Colors.white,
                  ),
                  SizedBox(width: 8),
                  Text(
                    'Engagement prédit: ${_getEngagementLabel(analysis.predictedEngagement)}',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getScoreLabel(String key) {
    const labels = {
      'caption': 'Caption',
      'hashtags': 'Hashtags',
      'timing': 'Timing',
      'structure': 'Structure',
    };
    return labels[key] ?? key;
  }

  Color _getScoreColor(int score) {
    if (score >= 90) return Colors.green;
    if (score >= 75) return Colors.lightGreen;
    if (score >= 60) return Colors.orange;
    return Colors.red;
  }

  Color _getEngagementColor(String engagement) {
    if (engagement == 'high') return Colors.green;
    if (engagement == 'medium') return Colors.orange;
    return Colors.red;
  }

  IconData _getEngagementIcon(String engagement) {
    if (engagement == 'high') return Icons.trending_up;
    if (engagement == 'medium') return Icons.trending_flat;
    return Icons.trending_down;
  }

  String _getEngagementLabel(String engagement) {
    const labels = {
      'high': 'ÉLEVÉ',
      'medium': 'MOYEN',
      'low': 'FAIBLE',
    };
    return labels[engagement] ?? engagement;
  }
}
```

### 2. Widget Sélecteur de Hooks

```dart
class ViralHooksSelector extends StatefulWidget {
  final Function(String) onHookSelected;

  const ViralHooksSelector({Key? key, required this.onHookSelected})
      : super(key: key);

  @override
  _ViralHooksSelectorState createState() => _ViralHooksSelectorState();
}

class _ViralHooksSelectorState extends State<ViralHooksSelector> {
  List<String> hooks = [];
  String? selectedHook;
  bool isLoading = false;

  Future<void> _generateHooks(String topic, String platform, String tone) async {
    setState(() => isLoading = true);
    try {
      final service = CreativeAIService(/* votre token */);
      final newHooks = await service.generateViralHooks(
        topic: topic,
        platform: platform,
        tone: tone,
        count: 5,
      );
      setState(() {
        hooks = newHooks;
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '🎣 Hooks Viraux',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 16),
            
            if (isLoading)
              Center(child: CircularProgressIndicator())
            else if (hooks.isEmpty)
              Center(
                child: Text('Générez des hooks pour commencer'),
              )
            else
              ...hooks.map((hook) {
                final isSelected = hook == selectedHook;
                return InkWell(
                  onTap: () {
                    setState(() => selectedHook = hook);
                    widget.onHookSelected(hook);
                  },
                  child: Container(
                    margin: EdgeInsets.only(bottom: 8),
                    padding: EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isSelected ? Colors.blue[50] : Colors.grey[100],
                      border: Border.all(
                        color: isSelected ? Colors.blue : Colors.grey[300]!,
                        width: isSelected ? 2 : 1,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          isSelected
                              ? Icons.radio_button_checked
                              : Icons.radio_button_unchecked,
                          color: isSelected ? Colors.blue : Colors.grey,
                        ),
                        SizedBox(width: 12),
                        Expanded(child: Text(hook)),
                      ],
                    ),
                  ),
                );
              }).toList(),

            SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () => _generateHooks('café', 'instagram', 'fun'),
              icon: Icon(Icons.refresh),
              label: Text('Générer plus'),
              style: ElevatedButton.styleFrom(
                minimumSize: Size(double.infinity, 48),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

### 3. Widget Calendrier Optimal

```dart
class OptimalTimingCalendar extends StatelessWidget {
  final OptimalTiming timing;

  const OptimalTimingCalendar({Key? key, required this.timing})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '⏰ Meilleurs moments pour poster',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 16),

            // Meilleurs moments
            ...timing.bestTimes.map((slot) {
              return Container(
                margin: EdgeInsets.only(bottom: 12),
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.green[50],
                  border: Border.all(color: Colors.green),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.check_circle, color: Colors.green),
                            SizedBox(width: 8),
                            Text(
                              '${slot.dayFr} ${slot.time}',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                          ],
                        ),
                        Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.green,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            '${slot.score}/100',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 8),
                    Text(slot.reason),
                    if (slot.expectedEngagement != null) ...[
                      SizedBox(height: 4),
                      Text(
                        'Engagement: ${slot.expectedEngagement}',
                        style: TextStyle(
                          color: Colors.green[700],
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ],
                ),
              );
            }).toList(),

            Divider(height: 24),

            // Pires moments
            Text(
              '❌ À éviter',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            ...timing.worstTimes.map((slot) {
              return Container(
                margin: EdgeInsets.only(bottom: 8),
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red[50],
                  border: Border.all(color: Colors.red[200]!),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.cancel, color: Colors.red, size: 20),
                    SizedBox(width: 8),
                    Text('${slot.dayFr} ${slot.time}'),
                    SizedBox(width: 8),
                    Text(
                      '(${slot.score}/100)',
                      style: TextStyle(color: Colors.grey),
                    ),
                  ],
                ),
              );
            }).toList(),
          ],
        ),
      ),
    );
  }
}
```

---

## 🎯 Workflow Complet

```dart
class CreatePostScreen extends StatefulWidget {
  @override
  _CreatePostScreenState createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends State<CreatePostScreen> {
  final captionController = TextEditingController();
  List<String> hashtags = [];
  PostAnalysis? analysis;
  OptimalTiming? timing;

  @override
  void initState() {
    super.initState();
    _loadOptimalTiming();
  }

  Future<void> _loadOptimalTiming() async {
    final service = CreativeAIService(/* token */);
    final result = await service.getOptimalTiming(
      platform: 'instagram',
      contentType: 'post',
    );
    setState(() => timing = result);
  }

  Future<void> _analyzePost() async {
    final service = CreativeAIService(/* token */);
    final result = await service.analyzePost(
      caption: captionController.text,
      hashtags: hashtags,
      platform: 'instagram',
    );
    setState(() => analysis = result);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Créer un Post')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            // Sélecteur de hooks
            ViralHooksSelector(
              onHookSelected: (hook) {
                captionController.text = hook + '\n\n';
              },
            ),
            SizedBox(height: 16),

            // Caption
            TextField(
              controller: captionController,
              maxLines: 5,
              decoration: InputDecoration(
                labelText: 'Caption',
                border: OutlineInputBorder(),
              ),
            ),
            SizedBox(height: 16),

            // Bouton analyser
            ElevatedButton.icon(
              onPressed: _analyzePost,
              icon: Icon(Icons.analytics),
              label: Text('Analyser le post'),
              style: ElevatedButton.styleFrom(
                minimumSize: Size(double.infinity, 48),
              ),
            ),
            SizedBox(height: 16),

            // Résultat de l'analyse
            if (analysis != null) PostScoreCard(analysis: analysis!),
            SizedBox(height: 16),

            // Timing optimal
            if (timing != null) OptimalTimingCalendar(timing: timing!),
          ],
        ),
      ),
    );
  }
}
```

---

## ✅ Checklist d'Intégration

- [ ] Ajouter le package `http` dans `pubspec.yaml`
- [ ] Créer le service `CreativeAIService`
- [ ] Créer les modèles de données
- [ ] Implémenter les widgets UI
- [ ] Tester avec votre backend
- [ ] Gérer les erreurs et le loading
- [ ] Ajouter des animations
- [ ] Optimiser les performances

Tout est prêt pour demain! 🚀
