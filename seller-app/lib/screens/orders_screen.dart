import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../api_config.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<dynamic> _orders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _fetchOrders();
  }

  Future<void> _fetchOrders() async {
    try {
      final response = await http.get(Uri.parse('${ApiConfig.baseUrl}/api/orders'));
      if (response.statusCode == 200) {
        setState(() {
          _orders = jsonDecode(response.body);
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error fetching orders: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _updateOrderStatus(String id, String status, {String? trackingLink}) async {
    try {
      await http.put(
        Uri.parse('${ApiConfig.baseUrl}/api/orders/$id/status'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'status': status,
          'trackingLink': trackingLink ?? '',
        }),
      );
      _fetchOrders(); // Refresh orders after update
    } catch (e) {
      print('Error updating status: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          'Orders Management',
          style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.bold),
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.blue[600],
          unselectedLabelColor: Colors.grey,
          indicatorColor: Colors.blue[600],
          tabs: const [
            Tab(text: 'Pending'),
            Tab(text: 'Packed'),
            Tab(text: 'Shipped'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildOrderList('Processing'),
          _buildOrderList('Packed'),
          _buildOrderList('Shipped'),
        ],
      ),
    );
  }

  Widget _buildOrderList(String status) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());

    final filteredOrders = _orders.where((order) => order['status'] == status).toList();

    if (filteredOrders.isEmpty) {
      return Center(child: Text('No $status orders found.'));
    }

    final double screenWidth = MediaQuery.of(context).size.width;

    if (screenWidth > 650) {
      int crossAxisCount = 2;
      double childAspectRatio = 1.25;

      if (screenWidth > 1400) {
        crossAxisCount = 4;
        childAspectRatio = 1.10;
      } else if (screenWidth > 1000) {
        crossAxisCount = 3;
        childAspectRatio = 1.15;
      }

      return GridView.builder(
        padding: const EdgeInsets.all(20),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: crossAxisCount,
          childAspectRatio: childAspectRatio,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
        ),
        itemCount: filteredOrders.length,
        itemBuilder: (context, index) {
          return _buildOrderCard(filteredOrders[index]);
        },
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: filteredOrders.length,
      itemBuilder: (context, index) {
        return _buildOrderCard(filteredOrders[index]);
      },
    );
  }

  Widget _buildOrderCard(dynamic order) {
    final status = order['status'];
    final items = order['items'] as List<dynamic>;
    final firstItem = items.isNotEmpty ? items[0] : null;

    return Container(
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
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Order #${order['orderId']}',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  Text(
                    order['orderDate'] != null 
                        ? DateTime.parse(order['orderDate']).toLocal().toString().split('.')[0]
                        : 'Unknown Date',
                    style: const TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: _getStatusColor(status).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  status,
                  style: TextStyle(
                    color: _getStatusColor(status),
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          if (firstItem != null)
            Row(
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(12),
                    image: DecorationImage(
                      image: NetworkImage(firstItem['image'] ?? 'https://images.unsplash.com/photo-1594932224010-74f43a163102?w=500'),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        firstItem['name'] ?? 'Unknown Item',
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      Text(
                        'Size: ${firstItem['size'] ?? 'N/A'} | Qty: ${firstItem['quantity'] ?? 1}',
                        style: const TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                Text(
                  '₹${order['total']}',
                  style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blue[600]),
                ),
              ],
            ),
          if (items.length > 1)
            Padding(
              padding: const EdgeInsets.only(top: 8.0),
              child: Text('+ ${items.length - 1} more items', style: TextStyle(color: Colors.grey[600], fontSize: 12, fontStyle: FontStyle.italic)),
            ),
          const SizedBox(height: 20),
          const Divider(),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(Icons.person_outline, size: 16, color: Colors.grey),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  order['customerName'] ?? 'Unknown Customer',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const Icon(Icons.location_on_outlined, size: 16, color: Colors.grey),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  order['customerAddress'] ?? 'Unknown Address',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.right,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          if (status == 'Processing')
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => _showPackedDialog(context, order['_id']),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue[600],
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                child: const Text('Mark as Packed', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          if (status == 'Packed')
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => _showTrackingDialog(context, order['_id']),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange[600],
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                child: const Text('Add Tracking & Ship', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Processing': return Colors.blue;
      case 'Packed': return Colors.orange;
      case 'Shipped': return Colors.green;
      default: return Colors.grey;
    }
  }

  void _showPackedDialog(BuildContext context, String orderId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Packing', style: TextStyle(fontWeight: FontWeight.bold)),
        content: const Text('Are you sure the items are packed and ready for shipping?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _updateOrderStatus(orderId, 'Packed');
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.blue[600], foregroundColor: Colors.white),
            child: const Text('Yes, Packed'),
          ),
        ],
      ),
    );
  }

  void _showTrackingDialog(BuildContext context, String orderId) {
    final TextEditingController courierController = TextEditingController();
    final TextEditingController trackingController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Shipping Details', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: courierController,
              decoration: InputDecoration(
                labelText: 'Courier Service',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: trackingController,
              decoration: InputDecoration(
                labelText: 'Tracking Number',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _updateOrderStatus(orderId, 'Shipped', trackingLink: '${courierController.text} - ${trackingController.text}');
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.orange[600], foregroundColor: Colors.white),
            child: const Text('Ship Order'),
          ),
        ],
      ),
    );
  }
}
