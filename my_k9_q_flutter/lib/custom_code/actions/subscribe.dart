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

/// Subscribes to a specified table in Supabase to receive real-time updates.
///
/// [table]: The name of the table to monitor in the Supabase database.
/// [callbackAction]: A callback function to execute when a change occurs in the table.
Future<void> subscribe(String table, Future Function() callbackAction) async {
  // Accessing the Supabase client and subscribing to a specific channel.
  // The channel corresponds to the specified table, indicated by 'public:$table'.
  // This is where we listen for real-time updates from the table.
  SupaFlow.client
      .channel('public:$table')
      // Setting up an event listener on the channel.
      // It listens for any Postgres changes (inserts, updates, deletes, etc.),
      // specifically on the 'public' schema of the given table.
      .onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: table,
        callback: (PostgresChangePayload payload) async {
          // Defining the action to take when an update is detected.
          // The function 'callbackAction' is called in response to these changes.
          await callbackAction();
        },
      )
      // Finalizing the subscription to start listening for the events.
      .subscribe();
}
