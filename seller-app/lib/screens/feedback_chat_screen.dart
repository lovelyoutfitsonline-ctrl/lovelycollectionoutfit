import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../api_config.dart';

class FeedbackChatScreen extends StatefulWidget {
  final String feedbackId;
  final String customerName;
  final String initialFeedback;
  final String reply;
  final String time;

  const FeedbackChatScreen({
    super.key,
    required this.feedbackId,
    required this.customerName,
    required this.initialFeedback,
    required this.reply,
    required this.time,
  });

  @override
  State<FeedbackChatScreen> createState() => _FeedbackChatScreenState();
}

class _FeedbackChatScreenState extends State<FeedbackChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final List<Map<String, dynamic>> _messages = [];
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    // Add the initial feedback as the first message from the customer
    _messages.add({
      'isSeller': false,
      'text': widget.initialFeedback,
      'time': widget.time,
    });
    // Add the seller's reply if it already exists
    if (widget.reply.isNotEmpty) {
      _messages.add({
        'isSeller': true,
        'text': widget.reply,
        'time': 'Saved Reply',
      });
    }
  }

  Future<void> _sendMessage() async {
    if (_messageController.text.trim().isEmpty || _isSending) return;

    final replyText = _messageController.text.trim();
    setState(() {
      _isSending = true;
    });

    try {
      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/api/feedback/${widget.feedbackId}/reply'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'reply': replyText}),
      );

      if (response.statusCode == 200) {
        setState(() {
          _messages.add({
            'isSeller': true,
            'text': replyText,
            'time': 'Just now',
          });
        });
        _messageController.clear();
        Navigator.pop(context, true); // Pop with success to refresh lists!
      } else {
        throw Exception('Failed to send reply');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error replying: $e'), backgroundColor: Colors.red),
      );
    } finally {
      setState(() {
        _isSending = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: Colors.blue[50],
              child: Text(
                widget.customerName.isNotEmpty ? widget.customerName.substring(0, 2).toUpperCase() : 'C',
                style: TextStyle(color: Colors.blue[600], fontWeight: FontWeight.bold, fontSize: 14),
              ),
            ),
            const SizedBox(width: 12),
            Text(
              widget.customerName,
              style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 16),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                final isSeller = message['isSeller'];
                return _buildMessageBubble(message['text'], message['time'], isSeller);
              },
            ),
          ),
          _buildMessageInput(),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(String text, String time, bool isSeller) {
    return Align(
      alignment: isSeller ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSeller ? Colors.blue[600] : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(20),
            topRight: const Radius.circular(20),
            bottomLeft: isSeller ? const Radius.circular(20) : const Radius.circular(4),
            bottomRight: isSeller ? const Radius.circular(4) : const Radius.circular(20),
          ),
          boxShadow: [
            if (!isSeller)
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 5,
                offset: const Offset(0, 2),
              ),
          ],
        ),
        child: Column(
          crossAxisAlignment: isSeller ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Text(
              text,
              style: TextStyle(
                color: isSeller ? Colors.white : Colors.black87,
                fontSize: 15,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              time,
              style: TextStyle(
                color: isSeller ? Colors.blue[100] : Colors.grey[500],
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _messageController,
                maxLines: null,
                decoration: InputDecoration(
                  hintText: 'Type your reply...',
                  hintStyle: TextStyle(color: Colors.grey[400]),
                  filled: true,
                  fillColor: Colors.grey[50],
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Container(
              decoration: BoxDecoration(
                color: Colors.blue[600],
                shape: BoxShape.circle,
              ),
              child: IconButton(
                icon: _isSending
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Icon(Icons.send, color: Colors.white, size: 20),
                onPressed: _isSending ? null : _sendMessage,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
