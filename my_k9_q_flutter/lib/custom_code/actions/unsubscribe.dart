// Automatic FlutterFlow imports
import '/backend/supabase/supabase.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'index.dart'; // Imports other custom actions
import '/flutter_flow/custom_functions.dart'; // Imports custom functions
import 'package:flutter/material.dart';
// Begin custom action code
// DO NOT REMOVE OR MODIFY THE CODE ABOVE!

import 'package:supabase_flutter/supabase_flutter.dart';

/// Unsubscribes from a previously established real-time connection to a specified table in Supabase.
///
/// [table]: The name of the table from which to disconnect in the Supabase database.
Future<void> unsubscribe(String table) async {
  // Accessing the Supabase client and the specific channel for the table.
  // The channel is identified by 'public:$table', corresponding to the table we want to unsubscribe from.
  final channel = SupaFlow.client.channel('public:$table');

  // Unsubscribing from the channel.
  // This stops the real-time updates and event listening from the specified table.
  await channel.unsubscribe();
}
