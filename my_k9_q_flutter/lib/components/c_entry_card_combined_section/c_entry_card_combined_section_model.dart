import '/backend/api_requests/api_calls.dart';
import '/backend/supabase/supabase.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'c_entry_card_combined_section_widget.dart'
    show CEntryCardCombinedSectionWidget;
import 'package:flutter/material.dart';

class CEntryCardCombinedSectionModel
    extends FlutterFlowModel<CEntryCardCombinedSectionWidget> {
  ///  State fields for stateful widgets in this component.

  // Stores action output result for [Backend Call - Update Row(s)] action in PendingCardCombinedSection widget.
  List<TblEntryQueueRow>? apiResultWithoutSection;
  // Stores action output result for [Backend Call - API (GetSelfCheckinRealtimeResults)] action in CheckInCombinedSection widget.
  ApiCallResponse? aoApiResultSelfCheckinRealtimeResult;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {}
}
