import 'package:shared_preferences/shared_preferences.dart';

class ApiConfig {
  static const String defaultUrl = 'http://10.0.2.2:5000'; // Default emulator address
  static String _baseUrl = 'http://localhost:5000';

  static String get baseUrl => _baseUrl;

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    // Default to localhost, or 10.0.2.2 if you want emulator support, but let's default to localhost:5000
    _baseUrl = prefs.getString('backend_base_url') ?? 'http://localhost:5000';
  }

  static Future<void> setBaseUrl(String url) async {
    String formattedUrl = url.trim();
    if (formattedUrl.endsWith('/')) {
      formattedUrl = formattedUrl.substring(0, formattedUrl.length - 1);
    }
    if (formattedUrl.isNotEmpty && !formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'http://$formattedUrl';
    }
    _baseUrl = formattedUrl;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('backend_base_url', _baseUrl);
  }
}
