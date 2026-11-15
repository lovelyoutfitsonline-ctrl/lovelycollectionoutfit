import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'feedback_chat_screen.dart';
import '../api_config.dart';

class FeedbackScreen extends StatefulWidget {
  const FeedbackScreen({super.key});

  @override
  State<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends State<FeedbackScreen> {
  List<dynamic> _feedbackList = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchFeedback();
  }

  Future<void> _fetchFeedback() async {
    try {
      final response = await http.get(Uri.parse('${ApiConfig.baseUrl}/api/feedback'));
      if (response.statusCode == 200) {
        setState(() {
          _feedbackList = jsonDecode(response.body);
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error fetching feedback: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Customer Feedback',
          style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _feedbackList.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.chat_bubble_outline, size: 64, color: Colors.grey),
                      SizedBox(height: 16),
                      Text(
                        'No messages received yet',
                        style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _fetchFeedback,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(20),
                    itemCount: _feedbackList.length,
                    itemBuilder: (context, index) {
                      return _buildFeedbackCard(context, _feedbackList[index]);
                    },
                  ),
                ),
    );
  }

  Widget _buildFeedbackCard(BuildContext context, dynamic feedback) {
    final customerName = feedback['customerName'] ?? 'Anonymous';
    final feedbackText = feedback['comment'] ?? '';
    final hasReply = feedback['reply'] != null && feedback['reply'].toString().isNotEmpty;
    final timeStr = feedback['createdAt'] != null
        ? DateTime.parse(feedback['createdAt']).toLocal().toString().split('.')[0]
        : 'Just now';

    return InkWell(
      onTap: () async {
        final result = await Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => FeedbackChatScreen(
              feedbackId: feedback['_id'] ?? '',
              customerName: customerName,
              initialFeedback: feedbackText,
              reply: feedback['reply'] ?? '',
              time: timeStr,
            ),
          ),
        );
        if (result == true) {
          _fetchFeedback();
        }
      },
      borderRadius: BorderRadius.circular(24),
      child: Container(
        margin: const EdgeInsets.only(bottom: 20),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: Colors.blue[50],
                  child: Text(
                    customerName.isNotEmpty ? customerName.substring(0, 2).toUpperCase() : 'C',
                    style: TextStyle(color: Colors.blue[600], fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        customerName,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Row(
                        children: List.generate(
                          5,
                          (i) => Icon(
                            Icons.star,
                            size: 14,
                            color: i < (feedback['rating'] ?? 5) ? Colors.orange : Colors.grey[300],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      timeStr.split(' ')[0],
                      style: const TextStyle(color: Colors.grey, fontSize: 11),
                    ),
                    if (hasReply) ...[
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.green[50],
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          'Replied',
                          style: TextStyle(color: Colors.green[700], fontSize: 9, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              feedbackText,
              style: const TextStyle(color: Colors.black87, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}
