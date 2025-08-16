import '/backend/api_requests/api_calls.dart';
import '/backend/supabase/supabase.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'c_entry_card_separate_section_widget.dart'
    show CEntryCardSeparateSectionWidget;
import 'package:flutter/material.dart';

class CEntryCardSeparateSectionModel
    extends FlutterFlowModel<CEntryCardSeparateSectionWidget> {
  ///  State fields for stateful widgets in this component.

  // Stores action output result for [Backend Call - Update Row(s)] action in ContainerPendingCardWithSection widget.
  List<TblEntryQueueRow>? apiResultWithSection;
  // Stores action output result for [Backend Call - API (GetSelfCheckinRealtimeResults)] action in CheckInWithSection widget.
  ApiCallResponse? apiSelfCheckInRealtimeResultsWithSection;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {}
}
