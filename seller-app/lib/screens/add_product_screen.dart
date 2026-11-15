import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:typed_data';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import '../api_config.dart';

class AddProductScreen extends StatefulWidget {
  final bool isEditing;
  final Map<String, dynamic>? product;
  const AddProductScreen({super.key, this.isEditing = false, this.product});

  @override
  State<AddProductScreen> createState() => _AddProductScreenState();
}

class _AddProductScreenState extends State<AddProductScreen> {
  final List<String> _selectedSizes = [];
  final Map<String, TextEditingController> _sizeStockControllers = {};
  List<String> _categories = ['+ Add New Category'];
  String _selectedCategory = '+ Add New Category';

  List<XFile> _productImageFiles = [];
  List<Uint8List> _productImageBytesList = [];
  List<String> _existingImageUrls = [];
  XFile? _categoryImageFile;
  Uint8List? _categoryImageBytes;
  bool _isMediaHovered = false;

  bool _isOfferProduct = false;
  String _selectedOfferType = 'COMBO300';

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _descController = TextEditingController();
  final TextEditingController _priceController = TextEditingController();
  final TextEditingController _originalPriceController = TextEditingController();
  final TextEditingController _customSizeController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchCategories();
    
    if (widget.isEditing && widget.product != null) {
      _nameController.text = widget.product!['name'] ?? '';
      _descController.text = widget.product!['description'] ?? '';
      _priceController.text = widget.product!['price']?.toString() ?? '';
      _originalPriceController.text = widget.product!['originalPrice']?.toString() ?? '';
      _selectedCategory = widget.product!['category'] ?? '';
      
      if (widget.product!['images'] != null && widget.product!['images'] is List) {
        final rawImgs = widget.product!['images'] as List;
        for (var img in rawImgs) {
          if (img != null && img.toString().isNotEmpty) {
            _existingImageUrls.add(img.toString());
          }
        }
      }
      if (_existingImageUrls.isEmpty && widget.product!['image'] != null && widget.product!['image'].toString().isNotEmpty) {
        _existingImageUrls.add(widget.product!['image'].toString());
      }
      
      final combo = widget.product!['combo_group'];
      if (combo != null && combo != 'null' && combo.toString().isNotEmpty) {
        _isOfferProduct = true;
        _selectedOfferType = combo.toString();
      }
      if (widget.product!['sizes'] != null) {
        final rawSizes = widget.product!['sizes'];
        if (rawSizes is List) {
          for (var item in rawSizes) {
            if (item is String) {
              if (!_selectedSizes.contains(item)) _selectedSizes.add(item);
              _sizeStockControllers[item] = TextEditingController(text: '0');
            } else if (item is Map) {
              final size = item['size']?.toString() ?? '';
              final stock = item['stock']?.toString() ?? '0';
              if (size.isNotEmpty) {
                if (!_selectedSizes.contains(size)) _selectedSizes.add(size);
                _sizeStockControllers[size] = TextEditingController(text: stock);
              }
            }
          }
        }
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    _priceController.dispose();
    _originalPriceController.dispose();
    _customSizeController.dispose();
    _sizeStockControllers.forEach((_, c) => c.dispose());
    super.dispose();
  }

  Future<void> _fetchCategories() async {
    try {
      final response = await http.get(Uri.parse('${ApiConfig.baseUrl}/api/categories'));
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        setState(() {
          _categories = data.map((c) => c['name'] as String).toList();
          _categories.add('+ Add New Category');
          if (_selectedCategory == '+ Add New Category' || _selectedCategory.isEmpty) {
            if (_categories.length > 1) {
              _selectedCategory = _categories[0];
            } else {
              _selectedCategory = '+ Add New Category';
            }
          } else if (!_categories.contains(_selectedCategory) && _selectedCategory.isNotEmpty) {
             _categories.insert(0, _selectedCategory);
          }
        });
      }
    } catch (e) {
      print('Error fetching categories: $e');
      setState(() {
        if (!_categories.contains('+ Add New Category')) {
          _categories = ['+ Add New Category'];
        }
        _selectedCategory = '+ Add New Category';
      });
    }
  }


  bool _isLoading = false;

  Future<void> _pickProductImages() async {
    final ImagePicker picker = ImagePicker();
    try {
      final List<XFile> selected = await picker.pickMultiImage();
      if (selected.isNotEmpty) {
        for (var image in selected) {
          final bytes = await image.readAsBytes();
          setState(() {
            _productImageFiles.add(image);
            _productImageBytesList.add(bytes);
          });
        }
      }
    } catch (e) {
      final XFile? single = await picker.pickImage(source: ImageSource.gallery);
      if (single != null) {
        final bytes = await single.readAsBytes();
        setState(() {
          _productImageFiles.add(single);
          _productImageBytesList.add(bytes);
        });
      }
    }
  }

  Future<void> _publishProduct() async {
    if (_nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a product name')),
      );
      return;
    }

    if (_priceController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a product price')),
      );
      return;
    }

    if (_descController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a product description')),
      );
      return;
    }

    if (_selectedCategory.isEmpty || _selectedCategory == '+ Add New Category') {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a valid category')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      List<String> finalImageUrls = List<String>.from(_existingImageUrls);
      
      if (_productImageFiles.isNotEmpty && _productImageBytesList.isNotEmpty) {
        for (int i = 0; i < _productImageFiles.length; i++) {
          try {
            final uploadUri = Uri.parse('${ApiConfig.baseUrl}/api/upload');
            final request = http.MultipartRequest('POST', uploadUri);
            
            request.files.add(
              http.MultipartFile.fromBytes(
                'image',
                _productImageBytesList[i],
                filename: _productImageFiles[i].name,
              ),
            );

            final streamedResponse = await request.send();
            final uploadResponse = await http.Response.fromStream(streamedResponse);

            if (uploadResponse.statusCode == 201) {
              final uploadData = jsonDecode(uploadResponse.body);
              if (uploadData['imageUrl'] != null) {
                finalImageUrls.add(uploadData['imageUrl']);
              }
            }
          } catch (e) {
            print('Error uploading file $i: $e');
          }
        }
      }

      if (finalImageUrls.isEmpty) {
        finalImageUrls.add('https://images.unsplash.com/photo-1594932224010-74f43a163102?w=500');
      }

      final primaryImageUrl = finalImageUrls.first;

      final url = widget.isEditing 
          ? '${ApiConfig.baseUrl}/api/products/${widget.product!['_id']}'
          : '${ApiConfig.baseUrl}/api/products';
          
      final sizesPayload = _selectedSizes.map((size) {
        final stockVal = int.tryParse(_sizeStockControllers[size]?.text ?? '0') ?? 0;
        return {
          'size': size,
          'stock': stockVal,
        };
      }).toList();

      final payload = {
        'name': _nameController.text,
        'description': _descController.text,
        'price': int.tryParse(_priceController.text) ?? 0,
        'originalPrice': int.tryParse(_originalPriceController.text) ?? 0,
        'category': _selectedCategory,
        'sizes': sizesPayload,
        'image': primaryImageUrl,
        'images': finalImageUrls,
        'combo_group': _isOfferProduct ? _selectedOfferType : null,
      };

      final response = widget.isEditing
          ? await http.put(
              Uri.parse(url),
              headers: {'Content-Type': 'application/json'},
              body: jsonEncode(payload),
            )
          : await http.post(
              Uri.parse(url),
              headers: {'Content-Type': 'application/json'},
              body: jsonEncode(payload),
            );

      if (response.statusCode == 201 || response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(widget.isEditing ? 'Product updated!' : 'Product added successfully!'), backgroundColor: Colors.green),
        );
        Navigator.pop(context, true); // Return true to indicate success
      } else {
        String errMsg = 'Failed to save product';
        try {
          final decoded = jsonDecode(response.body);
          if (decoded is Map && decoded.containsKey('message')) {
            errMsg = decoded['message'];
          } else if (decoded is Map && decoded.containsKey('error')) {
            errMsg = decoded['error'];
          }
        } catch (_) {}
        throw Exception(errMsg);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          widget.isEditing ? 'Edit Product' : 'Add New Product',
          style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.bold),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildMediaSection(),
            const SizedBox(height: 32),
            _buildTextField('Product Name', 'e.g. Premium Linen Shirt', controller: _nameController),
            const SizedBox(height: 20),
            _buildCategoryDropdown(),
            const SizedBox(height: 20),
            _buildTextField('Description', 'Describe your product...', maxLines: 4, controller: _descController),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(child: _buildTextField('Price (₹)', '999', controller: _priceController, isNumber: true)),
                const SizedBox(width: 16),
                Expanded(child: _buildTextField('Original Price (₹)', '1999', controller: _originalPriceController, isNumber: true)),
              ],
            ),
            const SizedBox(height: 24),
            _buildOfferSection(),
            const SizedBox(height: 32),
            Text(
              'Available Sizes',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 12),
            _buildSizeSelector(),
            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _publishProduct,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue[600],
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
                child: _isLoading 
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Text(
                        widget.isEditing ? 'Update Product' : 'Publish Product',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildOfferSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.green[50]?.withOpacity(0.3),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _isOfferProduct ? Colors.green[400]! : Colors.grey[300]!,
          width: 2,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(
                    Icons.local_offer_outlined,
                    color: _isOfferProduct ? Colors.green[600] : Colors.grey[600],
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Add to Offer Page',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                      color: _isOfferProduct ? Colors.green[800] : Colors.grey[800],
                    ),
                  ),
                ],
              ),
              Switch(
                value: _isOfferProduct,
                activeColor: Colors.green[600],
                onChanged: (value) {
                  setState(() {
                    _isOfferProduct = value;
                    if (_isOfferProduct) {
                      if (_selectedOfferType == 'COMBO300') {
                        _priceController.text = '300';
                      } else {
                        _priceController.text = '200';
                      }
                    }
                  });
                },
              ),
            ],
          ),
          if (_isOfferProduct) ...[
            const Divider(height: 24),
            Text(
              'Select Offer Type',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 13,
                color: Colors.grey[700],
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.grey[300]!),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  isExpanded: true,
                  value: _selectedOfferType,
                  items: const [
                    DropdownMenuItem(
                      value: 'COMBO300',
                      child: Text('4 Shirts for ₹999 (Any ₹300 product)'),
                    ),
                    DropdownMenuItem(
                      value: 'COMBO200',
                      child: Text('3 Shirts for ₹500 (Any ₹200 product)'),
                    ),
                  ],
                  onChanged: (value) {
                    if (value != null) {
                      setState(() {
                        _selectedOfferType = value;
                        if (_selectedOfferType == 'COMBO300') {
                          _priceController.text = '300';
                        } else {
                          _priceController.text = '200';
                        }
                      });
                    }
                  },
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildMediaSection() {
    final totalImagesCount = _existingImageUrls.length + _productImageFiles.length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Product Images (Multiple)',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.grey[800]),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.blue[200]!),
              ),
              child: Text(
                '$totalImagesCount ${totalImagesCount == 1 ? 'Photo' : 'Photos'}',
                style: TextStyle(color: Colors.blue[800], fontWeight: FontWeight.bold, fontSize: 12),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 140,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              // Existing Images
              ...List.generate(_existingImageUrls.length, (index) {
                final url = _existingImageUrls[index];
                return Container(
                  width: 120,
                  margin: const EdgeInsets.only(right: 12),
                  child: Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.network(
                          url,
                          width: 120,
                          height: 140,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            color: Colors.grey[200],
                            child: const Icon(Icons.broken_image, color: Colors.grey),
                          ),
                        ),
                      ),
                      if (index == 0 && _productImageFiles.isEmpty)
                        Positioned(
                          top: 8,
                          left: 8,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.blue[600],
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'MAIN',
                              style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                      Positioned(
                        top: 6,
                        right: 6,
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              _existingImageUrls.removeAt(index);
                            });
                          },
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: Colors.black54,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.close, color: Colors.white, size: 16),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }),

              // Newly Selected Files
              ...List.generate(_productImageFiles.length, (index) {
                final file = _productImageFiles[index];
                final bytes = _productImageBytesList[index];
                final isMain = _existingImageUrls.isEmpty && index == 0;

                return Container(
                  width: 120,
                  margin: const EdgeInsets.only(right: 12),
                  child: Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: kIsWeb
                            ? Image.memory(
                                bytes,
                                width: 120,
                                height: 140,
                                fit: BoxFit.cover,
                              )
                            : Image.file(
                                File(file.path),
                                width: 120,
                                height: 140,
                                fit: BoxFit.cover,
                              ),
                      ),
                      if (isMain)
                        Positioned(
                          top: 8,
                          left: 8,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.blue[600],
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'MAIN',
                              style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                      Positioned(
                        top: 6,
                        right: 6,
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              _productImageFiles.removeAt(index);
                              _productImageBytesList.removeAt(index);
                            });
                          },
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: Colors.black54,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.close, color: Colors.white, size: 16),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }),

              // Add Image Card Button
              InkWell(
                onTap: _pickProductImages,
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  width: 120,
                  height: 140,
                  decoration: BoxDecoration(
                    color: Colors.blue[50]?.withValues(alpha: 0.4),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.blue[300]!, width: 2, style: BorderStyle.solid),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.add_photo_alternate_outlined, size: 32, color: Colors.blue[600]),
                      const SizedBox(height: 6),
                      Text(
                        '+ Add Photos',
                        style: TextStyle(color: Colors.blue[700], fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Select multiple',
                        style: TextStyle(color: Colors.grey, fontSize: 10),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTextField(String label, String hint, {int maxLines = 1, TextEditingController? controller, bool isNumber = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.grey[700]),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          maxLines: maxLines,
          keyboardType: isNumber ? TextInputType.number : TextInputType.text,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.grey[400]),
            filled: true,
            fillColor: Colors.grey[50],
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide.none,
            ),
            contentPadding: const EdgeInsets.all(16),
          ),
        ),
      ],
    );
  }

  Widget _buildCategoryDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Category',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.grey[700]),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(14),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              isExpanded: true,
              value: _categories.contains(_selectedCategory) ? _selectedCategory : (_categories.isNotEmpty ? _categories[0] : null),
              items: _categories.map((String value) {
                return DropdownMenuItem<String>(
                  value: value,
                  child: Text(
                    value,
                    style: TextStyle(
                      color: value == '+ Add New Category' ? Colors.blue[600] : Colors.black87,
                      fontWeight: value == '+ Add New Category' ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                );
              }).toList(),
              onChanged: (String? newValue) {
                if (newValue == '+ Add New Category') {
                  _showAddCategoryDialog();
                } else if (newValue != null && newValue != '') {
                  setState(() {
                    _selectedCategory = newValue;
                  });
                }
              },
            ),
          ),
        ),
      ],
    );
  }

  void _showAddCategoryDialog() {
    final TextEditingController _categoryController = TextEditingController();
    _categoryImageFile = null;
    _categoryImageBytes = null;
    bool _isAddingCategory = false;
    String? _errorMessage;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            title: const Text('Add New Category', style: TextStyle(fontWeight: FontWeight.bold)),
            content: SizedBox(
              width: 360,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: _categoryController,
                      onChanged: (val) {
                        if (_errorMessage != null) {
                          setDialogState(() {
                            _errorMessage = null;
                          });
                        }
                      },
                      decoration: InputDecoration(
                        hintText: 'Category Name',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                    const SizedBox(height: 16),
                    InkWell(
                      onTap: () async {
                        final ImagePicker picker = ImagePicker();
                        final XFile? image = await picker.pickImage(source: ImageSource.gallery);
                        if (image != null) {
                          final bytes = await image.readAsBytes();
                          setDialogState(() {
                            _categoryImageFile = image;
                            _categoryImageBytes = bytes;
                            _errorMessage = null;
                          });
                        }
                      },
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        width: double.infinity,
                        height: 120,
                        decoration: BoxDecoration(
                          color: Colors.grey[50],
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey[300]!, style: BorderStyle.solid),
                        ),
                        child: _isAddingCategory
                            ? const Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    CircularProgressIndicator(),
                                    SizedBox(height: 12),
                                    Text(
                                      'Uploading image...',
                                      style: TextStyle(
                                        color: Colors.blue,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ),
                              )
                            : (_categoryImageFile != null
                                ? ClipRRect(
                                    borderRadius: BorderRadius.circular(12),
                                    child: kIsWeb
                                        ? Image.network(
                                            _categoryImageFile!.path,
                                            fit: BoxFit.cover,
                                            width: double.infinity,
                                          )
                                        : Image.file(
                                            File(_categoryImageFile!.path),
                                            fit: BoxFit.cover,
                                            width: double.infinity,
                                          ),
                                  )
                                : Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.cloud_upload_outlined, size: 32, color: Colors.blue[600]),
                                      const SizedBox(height: 8),
                                      const Text('Upload Image', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                                    ],
                                  )),
                      ),
                    ),
                    if (_errorMessage != null) ...[
                      const SizedBox(height: 16),
                      Text(
                        _errorMessage!,
                        style: const TextStyle(color: Colors.red, fontSize: 13, fontWeight: FontWeight.bold),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: _isAddingCategory ? null : () {
                  setState(() {
                    _selectedCategory = _categories[0];
                    _categoryImageFile = null;
                    _categoryImageBytes = null;
                  });
                  Navigator.pop(context);
                }, 
                child: const Text('Cancel')
              ),
              ElevatedButton(
                onPressed: _isAddingCategory ? null : () async {
                  if (_categoryController.text.trim().isEmpty) {
                    setDialogState(() {
                      _errorMessage = 'Please enter a category name';
                    });
                    return;
                  }
                  if (_categoryImageBytes == null || _categoryImageFile == null) {
                    setDialogState(() {
                      _errorMessage = 'Please upload a category image';
                    });
                    return;
                  }

                  setDialogState(() {
                    _isAddingCategory = true;
                    _errorMessage = null;
                  });
                  try {
                    // 1. Upload the image
                    final uploadUri = Uri.parse('${ApiConfig.baseUrl}/api/upload');
                    final request = http.MultipartRequest('POST', uploadUri);
                    
                    request.files.add(
                      http.MultipartFile.fromBytes(
                        'image',
                        _categoryImageBytes!,
                        filename: _categoryImageFile!.name,
                      ),
                    );

                    final streamedResponse = await request.send();
                    final uploadResponse = await http.Response.fromStream(streamedResponse);

                    if (uploadResponse.statusCode == 201) {
                      final uploadData = jsonDecode(uploadResponse.body);
                      final imageUrl = uploadData['imageUrl'];

                      // 2. Create the Category
                      final response = await http.post(
                        Uri.parse('${ApiConfig.baseUrl}/api/categories'),
                        headers: {'Content-Type': 'application/json'},
                        body: jsonEncode({
                          'name': _categoryController.text,
                          'image': imageUrl,
                        }),
                      );
                      
                      if (response.statusCode == 201) {
                        await _fetchCategories();
                        setState(() {
                          _selectedCategory = _categoryController.text;
                          _categoryImageFile = null;
                          _categoryImageBytes = null;
                        });
                        Navigator.pop(context);
                      } else {
                        setDialogState(() {
                          _errorMessage = 'Failed to create category: Status ${response.statusCode}';
                        });
                      }
                    } else {
                      setDialogState(() {
                        _errorMessage = 'Image upload failed: Status ${uploadResponse.statusCode}';
                      });
                    }
                  } catch (e) {
                    print('Error saving category: $e');
                    setDialogState(() {
                      _errorMessage = 'Connection Error: Cannot reach ${ApiConfig.baseUrl}';
                    });
                  } finally {
                    setDialogState(() {
                      _isAddingCategory = false;
                    });
                  }
                },
                style: ElevatedButton.styleFrom(backgroundColor: Colors.blue[600], foregroundColor: Colors.white),
                child: _isAddingCategory 
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Add Category'),
              ),
            ],
          );
        }
      ),
    );
  }


  void _addCustomSize() {
    final newSize = _customSizeController.text.trim();
    if (newSize.isEmpty) return;

    if (_selectedSizes.contains(newSize)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Size "$newSize" is already added!')),
      );
      return;
    }

    setState(() {
      _selectedSizes.add(newSize);
      _sizeStockControllers[newSize] = TextEditingController(text: '0');
      _customSizeController.clear();
    });
  }

  Widget _buildSizeSelector() {
    final presetSizes = ['S-36', 'M-38', 'L-40', 'XL-42', 'XXL-44', 'XXXL-46', 'Free Size', '28', '30', '32', '34', '36', '38'];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Select Standard Sizes',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Colors.grey[700]),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: presetSizes.map((size) {
            final isSelected = _selectedSizes.contains(size);
            return GestureDetector(
              onTap: () {
                setState(() {
                  if (isSelected) {
                    _selectedSizes.remove(size);
                    _sizeStockControllers[size]?.dispose();
                    _sizeStockControllers.remove(size);
                  } else {
                    _selectedSizes.add(size);
                    _sizeStockControllers[size] = TextEditingController(text: '0');
                  }
                });
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected ? Colors.blue[600] : Colors.grey[100],
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: isSelected ? Colors.blue[600]! : Colors.grey[300]!),
                ),
                child: Text(
                  size,
                  style: TextStyle(
                    color: isSelected ? Colors.white : Colors.black87,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 20),

        // Custom Size Input Section
        Text(
          'Type & Add Custom Size',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Colors.grey[700]),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _customSizeController,
                decoration: InputDecoration(
                  hintText: 'Enter size (e.g. Free Size, 28, 34, Custom)',
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.grey[300]!),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.grey[300]!),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Colors.blue, width: 2),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
                onSubmitted: (_) => _addCustomSize(),
              ),
            ),
            const SizedBox(width: 10),
            ElevatedButton.icon(
              onPressed: _addCustomSize,
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Add Size'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue[600],
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
              ),
            ),
          ],
        ),

        if (_selectedSizes.isNotEmpty) ...[
          const SizedBox(height: 20),
          Text(
            'Selected Available Sizes (${_selectedSizes.length}):',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey[800]),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _selectedSizes.map((size) {
              return Container(
                padding: const EdgeInsets.only(left: 12, right: 6, top: 6, bottom: 6),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.blue[200]!),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      size,
                      style: TextStyle(color: Colors.blue[900], fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    const SizedBox(width: 4),
                    InkWell(
                      onTap: () {
                        setState(() {
                          _selectedSizes.remove(size);
                          _sizeStockControllers[size]?.dispose();
                          _sizeStockControllers.remove(size);
                        });
                      },
                      child: Padding(
                        padding: const EdgeInsets.all(2.0),
                        child: Icon(Icons.cancel, size: 16, color: Colors.blue[700]),
                      ),
                    )
                  ],
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 24),
          Text(
            'Set Stock Quantities for Selected Sizes',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.grey[800]),
          ),
          const SizedBox(height: 12),
          ..._selectedSizes.map((size) {
            if (!_sizeStockControllers.containsKey(size)) {
              _sizeStockControllers[size] = TextEditingController(text: '0');
            }
            return Padding(
              padding: const EdgeInsets.only(bottom: 12.0),
              child: Row(
                children: [
                  Container(
                    constraints: const BoxConstraints(minWidth: 50),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.blue[50],
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.blue[100]!),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      size,
                      style: TextStyle(color: Colors.blue[600], fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextField(
                      controller: _sizeStockControllers[size],
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        hintText: 'Enter stock availability',
                        filled: true,
                        fillColor: Colors.grey[50],
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ],
      ],
    );
  }
}
