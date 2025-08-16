// Automatic FlutterFlow imports
import '/backend/supabase/supabase.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'index.dart'; // Imports other custom actions
import '/flutter_flow/custom_functions.dart'; // Imports custom functions
import 'package:flutter/material.dart';
// Begin custom action code
// DO NOT REMOVE OR MODIFY THE CODE ABOVE!

Future<List<String>> onReorder(
  int? oldIndex,
  int? newIndex,
  List<String>? items,
) async {
  // if oldIndex < newIdex, then newIdex -= 1, move item at oldIndex into newIndex
  if (oldIndex != null && newIndex != null && items != null) {
    if (oldIndex < newIndex) {
      newIndex -= 1;
    }
    final String item = items.removeAt(oldIndex);
    items.insert(newIndex, item);
    return items;
  } else {
    throw Exception('Invalid parameters');
  }
}
