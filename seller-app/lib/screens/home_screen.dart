import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'add_product_screen.dart';
import 'orders_screen.dart';
import 'main_screen.dart';
import '../api_config.dart';


class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<dynamic> _products = [];
  bool _isLoading = true;
  String _activeCategory = 'All';
  List<String> _categories = ['All'];
  final Set<String> _favoriteProductIds = {};

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    try {
      final catRes = await http.get(Uri.parse('${ApiConfig.baseUrl}/api/categories'));
      final prodRes = await http.get(Uri.parse('${ApiConfig.baseUrl}/api/products'));

      if (catRes.statusCode == 200 && prodRes.statusCode == 200) {
        final List<dynamic> catData = jsonDecode(catRes.body);
        setState(() {
          _categories = ['All', ...catData.map((c) => c['name'] as String)];
          _products = jsonDecode(prodRes.body);
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error fetching data: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _deleteProduct(String id) async {
    try {
      final res = await http.delete(Uri.parse('${ApiConfig.baseUrl}/api/products/$id'));
      if (res.statusCode == 200) {
        _fetchData();
      }
    } catch (e) {
      print('Error deleting product: $e');
    }
  }

  Future<void> _deleteCategory(String name) async {
    try {
      final res = await http.delete(Uri.parse('${ApiConfig.baseUrl}/api/categories/$name'));
      if (res.statusCode == 200) {
        if (_activeCategory == name) {
          setState(() {
            _activeCategory = 'All';
          });
        }
        _fetchData();
      }
    } catch (e) {
      print('Error deleting category: $e');
    }
  }

  void _showDeleteCategoryDialog(String categoryName) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Category', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to delete the category "$categoryName"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _deleteCategory(categoryName);
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red[600], foregroundColor: Colors.white),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  void _showSettingsDialog(BuildContext context) {
    final TextEditingController urlController = TextEditingController(text: ApiConfig.baseUrl);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('API Server Settings', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enter the backend URL/IP address (e.g. http://192.168.1.15:5000) to connect from your mobile device:',
              style: TextStyle(fontSize: 13, color: Colors.black54),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: urlController,
              decoration: InputDecoration(
                hintText: 'http://<IP_ADDRESS>:5000',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final newUrl = urlController.text.trim();
              if (newUrl.isNotEmpty) {
                await ApiConfig.setBaseUrl(newUrl);
                try {
                  final mainState = context.findAncestorStateOfType<State<MainScreen>>();
                  dynamic targetState = mainState ?? MainScreen.activeState;
                  if (targetState != null) {
                    targetState.reconnectSocket();
                  }
                } catch (e) {
                  print('Error reconnecting socket: $e');
                }
                if (mounted) {
                  Navigator.pop(context);
                  _fetchData();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('API URL updated and connection refreshed!'),
                      backgroundColor: Colors.green,
                    ),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.blue[600], foregroundColor: Colors.white),
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: CustomScrollView(
        slivers: [
          _buildAppBar(),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionHeader('Product Catalog'),
                  const SizedBox(height: 16),
                  _buildCategoryList(),
                  const SizedBox(height: 20),
                  _buildProductGrid(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAppBar() {
    return SliverAppBar(
      pinned: true,
      backgroundColor: Colors.white,
      elevation: 0,
      scrolledUnderElevation: 0,
      titleSpacing: 16,
      title: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Image.asset(
            'assets/logo.png',
            width: 38,
            height: 38,
            fit: BoxFit.contain,
            errorBuilder: (context, error, stackTrace) {
              return const Icon(
                Icons.shopping_bag_outlined,
                color: Color(0xFF1E3A8A),
                size: 26,
              );
            },
          ),
          const SizedBox(width: 10),
          Flexible(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: RichText(
                text: TextSpan(
                  style: GoogleFonts.outfit(
                    fontSize: 21,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.2,
                  ),
                  children: [
                    TextSpan(
                      text: 'Lovely',
                      style: GoogleFonts.outfit(
                        color: const Color(0xFF0F172A),
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.2,
                      ),
                    ),
                    TextSpan(
                      text: ' Outfits',
                      style: GoogleFonts.outfit(
                        color: const Color(0xFF2563EB),
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.2,
                      ),
                    ),
                    TextSpan(
                      text: ' Partner',
                      style: GoogleFonts.outfit(
                        color: const Color(0xFF64748B),
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.4,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          tooltip: 'Server Settings',
          onPressed: () => _showSettingsDialog(context),
          icon: const Icon(Icons.settings_outlined, color: Colors.black87),
        ),
        IconButton(
          onPressed: () => _showNotificationsBottomSheet(context),
          icon: const Icon(Icons.notifications_outlined, color: Colors.black87),
        ),
        const SizedBox(width: 10),
      ],
    );
  }

  Widget _buildSectionHeader(String title) {
    return Row(
      mainAxisAlignment:  MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
        TextButton(
          onPressed: () {},
          child: Text('View All', style: TextStyle(color: Colors.blue[600])),
        ),
      ],
    );
  }

  Widget _buildCategoryList() {
    return SizedBox(
      height: 40,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: _categories.length,
        itemBuilder: (context, index) {
          final category = _categories[index];
          final isSelected = _activeCategory == category;
          return Container(
            margin: const EdgeInsets.only(right: 12),
            decoration: BoxDecoration(
              color: isSelected ? Colors.blue[600] : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isSelected ? Colors.blue[600]! : Colors.grey[200]!,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                GestureDetector(
                  onTap: () {
                    setState(() {
                      _activeCategory = category;
                    });
                  },
                  child: Padding(
                    padding: EdgeInsets.only(
                      left: 16,
                      right: category == 'All' ? 16 : 8,
                      top: 8,
                      bottom: 8,
                    ),
                    child: Text(
                      category,
                      style: TextStyle(
                        color: isSelected ? Colors.white : Colors.grey[600],
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                      ),
                    ),
                  ),
                ),
                if (category != 'All')
                  GestureDetector(
                    onTap: () => _showDeleteCategoryDialog(category),
                    child: Padding(
                      padding: const EdgeInsets.only(right: 10),
                      child: Icon(
                        Icons.cancel,
                        size: 16,
                        color: isSelected ? Colors.white70 : Colors.red[300],
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildProductGrid() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    final filteredProducts = _activeCategory == 'All' 
        ? _products 
        : _products.where((p) => p['category'] == _activeCategory).toList();

    if (filteredProducts.isEmpty) {
      return const Center(child: Text('No products found.'));
    }

    final double screenWidth = MediaQuery.of(context).size.width;
    int crossAxisCount = 2;
    double childAspectRatio = 0.70;

    if (screenWidth > 1400) {
      crossAxisCount = 8;
      childAspectRatio = 0.75;
    } else if (screenWidth > 1100) {
      crossAxisCount = 6;
      childAspectRatio = 0.72;
    } else if (screenWidth > 800) {
      crossAxisCount = 4;
      childAspectRatio = 0.70;
    } else if (screenWidth > 550) {
      crossAxisCount = 3;
      childAspectRatio = 0.68;
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        childAspectRatio: childAspectRatio,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: filteredProducts.length,
      itemBuilder: (context, index) {
        return _buildProductCard(filteredProducts[index]);
      },
    );
  }

  Widget _buildProductCard(Map<String, dynamic> product) {
    final String productId = product['_id']?.toString() ?? product['id']?.toString() ?? '';
    final String productName = product['name'] ?? 'Product';
    final String shareUrl = '${ApiConfig.baseUrl}/product/$productId';
    final bool isLiked = _favoriteProductIds.contains(productId);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Stack(
              children: [
                Positioned.fill(
                  child: ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                    child: Image.network(
                      product['image'] ?? 'https://images.unsplash.com/photo-1594932224010-74f43a163102?w=500',
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(color: Colors.grey[200]),
                    ),
                  ),
                ),
                // Top-Right Floating Actions: Heart and 45-degree Share send icon
                Positioned(
                  top: 8,
                  right: 8,
                  child: Column(
                    children: [
                      // Heart Icon Button
                      GestureDetector(
                        onTap: () {
                          setState(() {
                            if (isLiked) {
                              _favoriteProductIds.remove(productId);
                            } else {
                              _favoriteProductIds.add(productId);
                            }
                          });
                        },
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.92),
                            borderRadius: BorderRadius.circular(10),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.12),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Icon(
                            isLiked ? Icons.favorite : Icons.favorite_border,
                            size: 18,
                            color: isLiked ? Colors.red : Colors.black87,
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      // Share Icon Button (Paper airplane pointing 45 degrees to the right: Icons.send_rounded)
                      GestureDetector(
                        onTap: () async {
                          final shareText = 'Check out $productName on Lovely Outfits!\n$shareUrl';
                          try {
                            await Share.share(shareText, subject: productName);
                          } catch (e) {
                            Clipboard.setData(ClipboardData(text: shareUrl));
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Product link copied to clipboard!'),
                                  backgroundColor: Colors.black87,
                                  behavior: SnackBarBehavior.floating,
                                ),
                              );
                            }
                          }
                        },
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.92),
                            borderRadius: BorderRadius.circular(10),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.12),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.send_rounded, // 45-degree angle send/paper plane icon
                            size: 16,
                            color: Colors.black87,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  product['name'] ?? 'Unnamed Product',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '₹${product['price']}',
                      style: TextStyle(
                        color: Colors.blue[600],
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    PopupMenuButton<String>(
                      padding: EdgeInsets.zero,
                      icon: const Icon(Icons.more_vert, size: 18, color: Colors.grey),
                      onSelected: (value) async {
                        if (value == 'edit') {
                          final result = await Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => AddProductScreen(
                                isEditing: true,
                                product: product,
                              ),
                            ),
                          );
                          if (result == true) {
                            _fetchData(); // Refresh after edit
                          }
                        } else if (value == 'delete') {
                          _showDeleteConfirmDialog(product['_id']);
                        }
                      },
                      itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
                        const PopupMenuItem<String>(
                          value: 'edit',
                          child: Text('Edit'),
                        ),
                        const PopupMenuItem<String>(
                          value: 'delete',
                          child: Text('Delete', style: TextStyle(color: Colors.red)),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showDeleteConfirmDialog(String productId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Product', style: TextStyle(fontWeight: FontWeight.bold)),
        content: const Text('Are you sure you want to delete this product? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _deleteProduct(productId);
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red[600], foregroundColor: Colors.white),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  void _showNotificationsBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setModalState) {
            return Container(
              height: MediaQuery.of(context).size.height * 0.75,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
              ),
              child: Column(
                children: [
                  const SizedBox(height: 12),
                  Container(
                    width: 50,
                    height: 5,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2.5),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.notifications_active_outlined, color: Colors.blue, size: 24),
                            SizedBox(width: 10),
                            Text(
                              'Notifications Inbox',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Colors.black87,
                              ),
                            ),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: Colors.grey),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ],
                    ),
                  ),
                  const Divider(),
                  Expanded(
                    child: FutureBuilder<List<dynamic>>(
                      future: _fetchRecentOrdersForNotifications(),
                      builder: (context, snapshot) {
                        if (snapshot.connectionState == ConnectionState.waiting) {
                          return const Center(child: CircularProgressIndicator());
                        } else if (snapshot.hasError) {
                          return const Center(child: Text('Error loading notifications'));
                        } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
                          return Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.notifications_none_outlined, size: 64, color: Colors.grey[300]),
                                const SizedBox(height: 16),
                                Text(
                                  'No new notifications',
                                  style: TextStyle(color: Colors.grey[600], fontSize: 16, fontWeight: FontWeight.w500),
                                ),
                              ],
                            ),
                          );
                        }

                        final notifications = snapshot.data!;

                        return ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                          itemCount: notifications.length,
                          itemBuilder: (context, index) {
                            final order = notifications[index];
                            final items = order['items'] as List<dynamic>? ?? [];
                            final firstItem = items.isNotEmpty ? items[0] : null;
                            final itemsCount = items.length;
                            final isNew = order['status'] == 'Processing';

                            return Container(
                              margin: const EdgeInsets.only(bottom: 16),
                              decoration: BoxDecoration(
                                color: isNew ? Colors.blue[50]!.withOpacity(0.4) : Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: isNew ? Colors.blue[100]! : Colors.grey[200]!,
                                  width: 1.5,
                                ),
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(20),
                                child: Material(
                                  color: Colors.transparent,
                                  child: InkWell(
                                    onTap: () {
                                      Navigator.pop(context); // Close bottom sheet drawer
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(builder: (context) => const OrdersScreen()),
                                      ); // Redirect dynamically to orders list
                                    },
                                    child: Padding(
                                      padding: const EdgeInsets.all(16.0),
                                      child: Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.all(10),
                                            decoration: BoxDecoration(
                                              color: isNew ? Colors.blue[500] : Colors.grey[200],
                                              shape: BoxShape.circle,
                                            ),
                                            child: Icon(
                                              Icons.shopping_bag,
                                              color: isNew ? Colors.white : Colors.grey[600],
                                              size: 20,
                                            ),
                                          ),
                                          const SizedBox(width: 14),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Row(
                                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                  children: [
                                                    Text(
                                                      isNew ? '🎉 New Order placed!' : 'Order received',
                                                      style: TextStyle(
                                                        fontWeight: FontWeight.bold,
                                                        fontSize: 14,
                                                        color: isNew ? Colors.blue[800] : Colors.black87,
                                                      ),
                                                    ),
                                                    if (isNew)
                                                      Container(
                                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                                        decoration: BoxDecoration(
                                                          color: Colors.blue[600],
                                                          borderRadius: BorderRadius.circular(10),
                                                        ),
                                                        child: const Text(
                                                          'NEW',
                                                          style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                                                        ),
                                                      ),
                                                  ],
                                                ),
                                                const SizedBox(height: 6),
                                                Text(
                                                  'Order #${order['orderId']} • Total: ₹${order['total']}',
                                                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Colors.black87),
                                                ),
                                                const SizedBox(height: 4),
                                                Text(
                                                  firstItem != null
                                                      ? '${firstItem['name']} (Size: ${firstItem['size']}${itemsCount > 1 ? ', + ${itemsCount - 1} more items' : ''})'
                                                      : 'No items detailed',
                                                  style: TextStyle(color: Colors.grey[600], fontSize: 12),
                                                ),
                                                const SizedBox(height: 6),
                                                Text(
                                                  order['orderDate'] != null
                                                      ? DateTime.parse(order['orderDate']).toLocal().toString().split('.')[0]
                                                      : 'Just now',
                                                  style: TextStyle(color: Colors.grey[400], fontSize: 10, fontWeight: FontWeight.w500),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            );
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Future<List<dynamic>> _fetchRecentOrdersForNotifications() async {
    try {
      final response = await http.get(Uri.parse('${ApiConfig.baseUrl}/api/orders'));
      if (response.statusCode == 200) {
        final List<dynamic> orders = jsonDecode(response.body);
        orders.sort((a, b) {
          final aDate = a['orderDate'] != null ? DateTime.parse(a['orderDate']) : DateTime.now();
          final bDate = b['orderDate'] != null ? DateTime.parse(b['orderDate']) : DateTime.now();
          return bDate.compareTo(aDate);
        });
        return orders;
      }
    } catch (e) {
      debugPrint('Error fetching notification orders: $e');
    }
    return [];
  }
}

