import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'dart:convert';
import 'home_screen.dart';
import 'analytics_screen.dart';
import 'orders_screen.dart';
import 'add_product_screen.dart';
import 'feedback_screen.dart';
import '../api_config.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  static _MainScreenState? activeState;

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;
  IO.Socket? _socket;

  final List<Widget> _screens = [
    const HomeScreen(),
    const AnalyticsScreen(),
    const OrdersScreen(),
    const FeedbackScreen(),
  ];

  @override
  void initState() {
    super.initState();
    MainScreen.activeState = this;
    _initSocket();
  }

  void reconnectSocket() {
    _socket?.disconnect();
    _socket?.dispose();
    _initSocket();
  }

  void _initSocket() {
    try {
      // Connect to the Node.js API server Socket.IO gateway
      _socket = IO.io(ApiConfig.baseUrl, IO.OptionBuilder()
        .setTransports(['websocket'])
        .enableAutoConnect()
        .build());

      _socket!.onConnect((_) {
        debugPrint('Seller App: Connected to order notification gateway.');
      });

      _socket!.onDisconnect((_) {
        debugPrint('Seller App: Disconnected from order notification gateway.');
      });

      // Listen for the real-time order events triggered by backend webhooks/checkouts
      _socket!.on('new-order', (data) {
        debugPrint('Seller App: Real-time Order Notification Received: $data');
        if (data != null) {
          Map<String, dynamic>? order;
          if (data is String) {
            try {
              order = Map<String, dynamic>.from(jsonDecode(data));
            } catch (e) {
              debugPrint('Error decoding JSON order data: $e');
            }
          } else if (data is Map) {
            order = Map<String, dynamic>.from(data);
          }

          if (order != null) {
            _showNewOrderNotification(order);
          }
        }
      });
    } catch (e) {
      debugPrint('Socket initialization error: $e');
    }
  }

  void _showNewOrderNotification(Map<String, dynamic> orderData) {
    final orderId = orderData['orderId'] ?? 'New Order';
    final totalAmount = orderData['totalAmount'] ?? orderData['total'] ?? 0;
    final products = orderData['products'] as List<dynamic>? ?? orderData['items'] as List<dynamic>? ?? [];
    final itemsCount = products.length;

    late OverlayEntry overlayEntry;

    overlayEntry = OverlayEntry(
      builder: (context) => Positioned(
        top: MediaQuery.of(context).padding.top + 16,
        left: 16,
        right: 16,
        child: Material(
          color: Colors.transparent,
          child: Container(
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [
                  Color(0xFF0F172A), // Slate 900
                  Color(0xFF1E3A8A), // Deep Cobalt 900
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF1E3A8A).withOpacity(0.35),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
              border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.4), width: 1.5),
            ),
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () {
                if (overlayEntry.mounted) {
                  overlayEntry.remove();
                }
                setState(() {
                  _selectedIndex = 2; // Switch dynamically to the Orders Screen Tab
                });
              },
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFF3B82F6).withOpacity(0.2),
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFF60A5FA), width: 1.5),
                      ),
                      child: const Icon(
                        Icons.shopping_bag_rounded,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '🎉 NEW ORDER RECEIVED!',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                  letterSpacing: 0.5,
                                ),
                              ),
                              Text(
                                'Just now',
                                style: TextStyle(
                                  color: Colors.grey,
                                  fontSize: 10,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Order #$orderId • $itemsCount item(s)',
                            style: const TextStyle(
                              color: Colors.white70,
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Total Amount: ₹$totalAmount',
                            style: const TextStyle(
                              color: Color(0xFF93C5FD), // Light blue text
                              fontWeight: FontWeight.w500,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Icon(
                      Icons.arrow_forward_ios,
                      color: Colors.white70,
                      size: 14,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );

    // Inject the notification overlay onto the widget tree
    Overlay.of(context).insert(overlayEntry);

    // Auto-discard notification after 7 seconds
    Future.delayed(const Duration(seconds: 7), () {
      if (overlayEntry.mounted) {
        overlayEntry.remove();
      }
    });
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  void dispose() {
    if (MainScreen.activeState == this) {
      MainScreen.activeState = null;
    }
    _socket?.disconnect();
    _socket?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        child: _selectedIndex == 2
            ? OrdersScreen(key: ValueKey('orders_$_selectedIndex'))
            : _screens[_selectedIndex],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const AddProductScreen()),
          );
          if (result == true && _selectedIndex == 0) {
            // Trigger home screen refresh if catalog modified
            setState(() {
              _selectedIndex = 0;
            });
          }
        },
        backgroundColor: Colors.blue[600],
        elevation: 4,
        shape: const CircleBorder(),
        child: const Icon(Icons.add, color: Colors.white, size: 28),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: BottomAppBar(
        color: Colors.white,
        shape: const CircularNotchedRectangle(),
        notchMargin: 8.0,
        child: SizedBox(
          height: 60,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(Icons.dashboard_outlined, Icons.dashboard, 'Home', 0),
              _buildNavItem(Icons.analytics_outlined, Icons.analytics, 'Analysis', 1),
              const SizedBox(width: 48), // Space for FAB
              _buildNavItem(Icons.shopping_bag_outlined, Icons.shopping_bag, 'Orders', 2),
              _buildNavItem(Icons.chat_bubble_outline, Icons.chat_bubble, 'Feedback', 3),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(IconData icon, IconData activeIcon, String label, int index) {
    final isSelected = _selectedIndex == index;
    return InkWell(
      onTap: () => _onItemTapped(index),
      splashColor: Colors.transparent,
      highlightColor: Colors.transparent,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            isSelected ? activeIcon : icon,
            color: isSelected ? Colors.blue[600] : Colors.grey[400],
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              color: isSelected ? Colors.blue[600] : Colors.grey[400],
            ),
          ),
        ],
      ),
    );
  }
}
