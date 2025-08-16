import '/backend/supabase/supabase.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'c_annc_edit_widget.dart' show CAnncEditWidget;
import 'package:flutter/material.dart';

class CAnncEditModel extends FlutterFlowModel<CAnncEditWidget> {
  ///  State fields for stateful widgets in this component.

  // State field(s) for AnncEditSubject widget.
  FocusNode? anncEditSubjectFocusNode;
  TextEditingController? anncEditSubjectTextController;
  String? Function(BuildContext, String?)?
      anncEditSubjectTextControllerValidator;
  // State field(s) for AnncEditBody widget.
  FocusNode? anncEditBodyFocusNode;
  TextEditingController? anncEditBodyTextController;
  String? Function(BuildContext, String?)? anncEditBodyTextControllerValidator;
  // Stores action output result for [Backend Call - Update Row(s)] action in editButton widget.
  List<TblAnnouncementsRow>? announcementEdit;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {
    anncEditSubjectFocusNode?.dispose();
    anncEditSubjectTextController?.dispose();

    anncEditBodyFocusNode?.dispose();
    anncEditBodyTextController?.dispose();
  }
}
