import '/backend/supabase/supabase.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'c_confirm_score_a_k_c_scent_work_national_widget.dart'
    show CConfirmScoreAKCScentWorkNationalWidget;
import 'package:flutter/material.dart';

class CConfirmScoreAKCScentWorkNationalModel
    extends FlutterFlowModel<CConfirmScoreAKCScentWorkNationalWidget> {
  ///  Local state fields for this component.

  String paramTrialDate = '';

  String paramTrialNumber = '';

  String paramElement = '';

  String paramLevel = '';

  ///  State fields for stateful widgets in this component.

  // Stores action output result for [Backend Call - Update Row(s)] action in ButtonConfirm widget.
  List<TblEntryQueueRow>? matchingEntryRows;
  // Stores action output result for [Backend Call - Update Row(s)] action in ButtonConfirm widget.
  List<TblClassQueueRow>? matchingClassRows;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {}
}
