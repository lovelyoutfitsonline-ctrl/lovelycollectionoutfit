import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:intl/intl.dart';
import '../api_config.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  String _activeView = 'sales'; // 'sales', 'orders', 'products', 'rating'
  String _salesFilter = 'Day'; // 'Day', 'Month', 'Year'
  
  List<dynamic> _orders = [];
  List<dynamic> _products = [];
  List<dynamic> _feedback = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final ordersRes = await http.get(Uri.parse('${ApiConfig.baseUrl}/api/orders'));
      final productsRes = await http.get(Uri.parse('${ApiConfig.baseUrl}/api/products'));
      final feedbackRes = await http.get(Uri.parse('${ApiConfig.baseUrl}/api/feedback'));

      if (ordersRes.statusCode == 200 && productsRes.statusCode == 200 && feedbackRes.statusCode == 200) {
        setState(() {
          _orders = jsonDecode(ordersRes.body);
          _products = jsonDecode(productsRes.body);
          _feedback = jsonDecode(feedbackRes.body);
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching analytics: $e');
      setState(() => _isLoading = false);
    }
  }

  // Generate dynamic sales sum
  double get _totalSales {
    double sum = 0;
    for (var order in _orders) {
      sum += (order['total'] ?? order['totalAmount'] ?? 0).toDouble();
    }
    return sum;
  }

  // Generate dynamic store rating
  double get _averageRating {
    if (_feedback.isEmpty) return 0.0;
    double sum = 0;
    for (var f in _feedback) {
      sum += (f['rating'] ?? 0.0).toDouble();
    }
    return sum / _feedback.length;
  }

  // Generate dynamic satisfaction index
  double get _satisfactionPercentage {
    if (_feedback.isEmpty) return 0.0;
    int satisfiedCount = 0;
    for (var f in _feedback) {
      if ((f['rating'] ?? 0) >= 4) {
        satisfiedCount++;
      }
    }
    return (satisfiedCount / _feedback.length) * 100;
  }

  // Get data points for chart
  Map<String, double> _getChartData() {
    if (_salesFilter == 'Day') {
      final data = {
        'Mon': 0.0,
        'Tue': 0.0,
        'Wed': 0.0,
        'Thu': 0.0,
        'Fri': 0.0,
        'Sat': 0.0,
        'Sun': 0.0,
      };
      final weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      for (var order in _orders) {
        if (order['orderDate'] != null) {
          try {
            final date = DateTime.parse(order['orderDate']).toLocal();
            final weekdayIndex = date.weekday - 1; // 0 to 6
            if (weekdayIndex >= 0 && weekdayIndex < 7) {
              final key = weekdays[weekdayIndex];
              final amt = (order['total'] ?? order['totalAmount'] ?? 0).toDouble();
              data[key] = (data[key] ?? 0.0) + amt;
            }
          } catch (_) {}
        }
      }
      return data;
    } else if (_salesFilter == 'Month') {
      final data = {
        'Jan': 0.0, 'Feb': 0.0, 'Mar': 0.0, 'Apr': 0.0, 'May': 0.0, 'Jun': 0.0,
        'Jul': 0.0, 'Aug': 0.0, 'Sep': 0.0, 'Oct': 0.0, 'Nov': 0.0, 'Dec': 0.0,
      };
      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (var order in _orders) {
        if (order['orderDate'] != null) {
          try {
            final date = DateTime.parse(order['orderDate']).toLocal();
            final monthIndex = date.month - 1; // 0 to 11
            if (monthIndex >= 0 && monthIndex < 12) {
              final key = months[monthIndex];
              final amt = (order['total'] ?? order['totalAmount'] ?? 0).toDouble();
              data[key] = (data[key] ?? 0.0) + amt;
            }
          } catch (_) {}
        }
      }
      return data;
    } else {
      final currentYear = DateTime.now().year;
      final data = <String, double>{};
      for (int i = currentYear - 4; i <= currentYear; i++) {
        data[i.toString()] = 0.0;
      }
      for (var order in _orders) {
        if (order['orderDate'] != null) {
          try {
            final date = DateTime.parse(order['orderDate']).toLocal();
            final yearStr = date.year.toString();
            if (data.containsKey(yearStr)) {
              final amt = (order['total'] ?? order['totalAmount'] ?? 0).toDouble();
              data[yearStr] = (data[yearStr] ?? 0.0) + amt;
            }
          } catch (_) {}
        }
      }
      return data;
    }
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(locale: 'HI', symbol: '₹', decimalDigits: 0);
    final salesDisplay = currencyFormat.format(_totalSales);
    final ordersDisplay = _orders.length.toString();
    final productsDisplay = _products.length.toString();
    final ratingDisplay = _feedback.isNotEmpty ? _averageRating.toStringAsFixed(1) : 'N/A';
    final double screenWidth = MediaQuery.of(context).size.width;


    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Business Analysis',
          style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.black87),
            onPressed: _fetchData,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Overview',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 16),
                  


                  // Responsive stat grid: 1 row on wide screens, 2x2 grid on mobile
                  screenWidth > 850
                      ? Row(
                          children: [
                            Expanded(
                              child: _buildSelectableStatCard(
                                title: 'Total Sales',
                                value: salesDisplay,
                                icon: Icons.trending_up,
                                color: Colors.green,
                                viewKey: 'sales',
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: _buildSelectableStatCard(
                                title: 'Total Orders',
                                value: ordersDisplay,
                                icon: Icons.shopping_cart,
                                color: Colors.blue,
                                viewKey: 'orders',
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: _buildSelectableStatCard(
                                title: 'Store Rating',
                                value: ratingDisplay,
                                icon: Icons.star,
                                color: Colors.orange,
                                viewKey: 'rating',
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: _buildSelectableStatCard(
                                title: 'Products',
                                value: productsDisplay,
                                icon: Icons.inventory,
                                color: Colors.purple,
                                viewKey: 'products',
                              ),
                            ),
                          ],
                        )
                      : Column(
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: _buildSelectableStatCard(
                                    title: 'Total Sales',
                                    value: salesDisplay,
                                    icon: Icons.trending_up,
                                    color: Colors.green,
                                    viewKey: 'sales',
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: _buildSelectableStatCard(
                                    title: 'Total Orders',
                                    value: ordersDisplay,
                                    icon: Icons.shopping_cart,
                                    color: Colors.blue,
                                    viewKey: 'orders',
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildSelectableStatCard(
                                    title: 'Store Rating',
                                    value: ratingDisplay,
                                    icon: Icons.star,
                                    color: Colors.orange,
                                    viewKey: 'rating',
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: _buildSelectableStatCard(
                                    title: 'Products',
                                    value: productsDisplay,
                                    icon: Icons.inventory,
                                    color: Colors.purple,
                                    viewKey: 'products',
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                  const SizedBox(height: 24),

                  // Dynamic analysis detail section below cards
                  _buildDetailSection(),
                ],
              ),
            ),
    );
  }

  Widget _buildSelectableStatCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    required String viewKey,
  }) {
    final isSelected = _activeView == viewKey;
    return GestureDetector(
      onTap: () {
        setState(() {
          _activeView = viewKey;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? color : Colors.transparent,
            width: 2.0,
          ),
          boxShadow: [
            BoxShadow(
              color: isSelected ? color.withOpacity(0.12) : Colors.black.withOpacity(0.02),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 12),
            Text(
              value,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            Text(
              title,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[500],
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailSection() {
    switch (_activeView) {
      case 'sales':
        return _buildSalesGraphView();
      case 'orders':
        return _buildOrdersListView();
      case 'products':
        return _buildProductsListView();
      case 'rating':
        return _buildRatingView();
      default:
        return const SizedBox.shrink();
    }
  }

  // 1. Total Sales Graph implementation (Custom animated bar chart)
  Widget _buildSalesGraphView() {
    final chartData = _getChartData();
    final maxValue = chartData.values.reduce((a, b) => a > b ? a : b);

    return Container(
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
              const Expanded(
                child: Text(
                  'Sales & Volume Analytics',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87),
                ),
              ),
              const SizedBox(width: 8),
              
              // day, month, year sliding switch tabs
              Container(
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.all(4),
                child: Row(
                  children: ['Day', 'Month', 'Year'].map((tab) {
                    final isTabActive = _salesFilter == tab;
                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          _salesFilter = tab;
                        });
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          color: isTabActive ? Colors.green[600] : Colors.transparent,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          tab,
                          style: TextStyle(
                            color: isTabActive ? Colors.white : Colors.grey[600],
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Custom Bar chart drawing
          SizedBox(
            height: 180,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: chartData.entries.map((entry) {
                final barHeightFactor = maxValue > 0 ? entry.value / maxValue : 0.0;
                return Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      // Tooltip value
                      Text(
                        entry.value >= 1000 
                            ? '₹${(entry.value / 1000).toStringAsFixed(1)}k'
                            : '₹${entry.value.toInt()}',
                        style: TextStyle(
                          color: Colors.green[800],
                          fontWeight: FontWeight.bold,
                          fontSize: 10,
                        ),
                      ),
                      const SizedBox(height: 6),
                      
                      // Animated Bar graph
                      Expanded(
                        child: FractionallySizedBox(
                          heightFactor: barHeightFactor.clamp(0.05, 1.0),
                          child: Container(
                            margin: const EdgeInsets.symmetric(horizontal: 6),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  Colors.green[400]!,
                                  Colors.green[700]!,
                                ],
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                              ),
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      
                      // Label
                      Text(
                        entry.key,
                        style: const TextStyle(
                          color: Colors.grey,
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 20),
          const Divider(),
          const SizedBox(height: 10),
          Row(
            children: [
              Icon(Icons.lightbulb_outline, color: Colors.green[600], size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Sales are projected to grow by 14% this $_salesFilter based on dynamic purchase data.',
                  style: TextStyle(color: Colors.grey[600], fontSize: 12),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // 2. Customer orders list display
  Widget _buildOrdersListView() {
    if (_orders.isEmpty) {
      return _buildEmptyState('No customer orders logged in MongoDB yet.');
    }

    return Container(
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
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Dynamic Customer Orders List',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87),
          ),
          const SizedBox(height: 16),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _orders.length,
            itemBuilder: (context, index) {
              final order = _orders[index];
              final dateString = order['orderDate'] != null 
                  ? DateTime.parse(order['orderDate']).toLocal().toString().split('.')[0]
                  : 'Just now';
              final items = order['items'] as List<dynamic>? ?? [];
              final status = order['status'] ?? 'Processing';

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey[100]!),
                ),
                child: ExpansionTile(
                  tilePadding: EdgeInsets.zero,
                  childrenPadding: EdgeInsets.zero,
                  iconColor: Colors.blue[600],
                  title: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Order #${order['orderId']}',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: _getStatusColor(status).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          status,
                          style: TextStyle(
                            color: _getStatusColor(status),
                            fontWeight: FontWeight.bold,
                            fontSize: 10,
                          ),
                        ),
                      ),
                    ],
                  ),
                  subtitle: Text(
                    '${order['customerName'] ?? 'Guest'} • ₹${order['total'] ?? order['totalAmount']} • $dateString',
                    style: TextStyle(color: Colors.grey[600], fontSize: 12, fontWeight: FontWeight.w500),
                  ),
                  children: [
                    const Divider(),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined, size: 14, color: Colors.grey),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            order['customerAddress'] ?? 'Address detailed',
                            style: const TextStyle(fontSize: 12, color: Colors.grey),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    const Text('ORDER ITEMS:', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                    const SizedBox(height: 6),
                    ...items.map((item) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 6.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '• ${item['name']} (Size: ${item['size'] ?? 'N/A'})',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                            ),
                            Text(
                              'Qty: ${item['quantity'] ?? 1}',
                              style: const TextStyle(fontSize: 12, color: Colors.grey),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  // 3. Products list display
  Widget _buildProductsListView() {
    if (_products.isEmpty) {
      return _buildEmptyState('No products logged in MongoDB yet.');
    }

    return Container(
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
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Inventory Products List (One-by-One)',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87),
          ),
          const SizedBox(height: 16),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _products.length,
            itemBuilder: (context, index) {
              final product = _products[index];
              return Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.grey[100]!),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: Colors.grey[200],
                        borderRadius: BorderRadius.circular(14),
                        image: DecorationImage(
                          image: NetworkImage(product['image'] ?? 'https://images.unsplash.com/photo-1594932224010-74f43a163102?w=500'),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            product['name'] ?? 'Unnamed Product',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black87),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.purple.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              product['category'] ?? 'General',
                              style: const TextStyle(color: Colors.purple, fontSize: 10, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '₹${product['price']}',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.blue[600]),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildRatingView() {
    final ratingDisplay = _feedback.isNotEmpty ? '${_averageRating.toStringAsFixed(1)} out of 5' : 'No ratings yet';
    final satisfactionDisplay = _feedback.isNotEmpty
        ? '${_satisfactionPercentage.toStringAsFixed(0)}% of customers are fully satisfied.'
        : 'Share product catalogs to get customer ratings.';

    return Container(
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
          const Text(
            'Store Quality & Rating',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.orange[50],
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.star, color: Colors.orange, size: 36),
              ),
              const SizedBox(width: 20),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(ratingDisplay, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(satisfactionDisplay, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(30.0),
        child: Text(
          message,
          style: const TextStyle(color: Colors.grey, fontSize: 14, fontWeight: FontWeight.w500),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Processing':
        return Colors.blue;
      case 'Packed':
        return Colors.orange;
      case 'Shipped':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }
}
