import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/main_screen.dart';
import 'screens/splash_screen.dart';
import 'api_config.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiConfig.init();
  runApp(const SellerApp());
}

class SellerApp extends StatelessWidget {
  const SellerApp({super.key});

  @override
  Widget build(BuildContext context) {
    final baseTextTheme = Theme.of(context).textTheme;
    return MaterialApp(
      title: 'Lovely Outfits Partner',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF2563EB),
          primary: const Color(0xFF2563EB),
        ),
        textTheme: GoogleFonts.outfitTextTheme(baseTextTheme),
        useMaterial3: true,
      ),
      home: const SplashScreen(),
    );
  }
}

