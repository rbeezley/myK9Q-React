import '/components/c_navigation_bar/c_navigation_bar_widget.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/index.dart';
import 'p_show_details_widget.dart' show PShowDetailsWidget;
import 'package:flutter/material.dart';

class PShowDetailsModel extends FlutterFlowModel<PShowDetailsWidget> {
  ///  State fields for stateful widgets in this page.

  bool isDataUploading_uploadDataQrw = false;
  FFUploadedFile uploadedLocalFile_uploadDataQrw =
      FFUploadedFile(bytes: Uint8List.fromList([]));
  String uploadedFileUrl_uploadDataQrw = '';

  // State field(s) for TextFieldChairman widget.
  FocusNode? textFieldChairmanFocusNode;
  TextEditingController? textFieldChairmanTextController;
  String? Function(BuildContext, String?)?
      textFieldChairmanTextControllerValidator;
  // State field(s) for TextFieldChairmanemail widget.
  FocusNode? textFieldChairmanemailFocusNode;
  TextEditingController? textFieldChairmanemailTextController;
  String? Function(BuildContext, String?)?
      textFieldChairmanemailTextControllerValidator;
  // State field(s) for TextFieldChairmanPhone widget.
  FocusNode? textFieldChairmanPhoneFocusNode;
  TextEditingController? textFieldChairmanPhoneTextController;
  String? Function(BuildContext, String?)?
      textFieldChairmanPhoneTextControllerValidator;
  // State field(s) for TextFieldSecretary widget.
  FocusNode? textFieldSecretaryFocusNode;
  TextEditingController? textFieldSecretaryTextController;
  String? Function(BuildContext, String?)?
      textFieldSecretaryTextControllerValidator;
  // State field(s) for TextFieldSecretaryEmail widget.
  FocusNode? textFieldSecretaryEmailFocusNode;
  TextEditingController? textFieldSecretaryEmailTextController;
  String? Function(BuildContext, String?)?
      textFieldSecretaryEmailTextControllerValidator;
  // State field(s) for TextFieldSecretaryPhone widget.
  FocusNode? textFieldSecretaryPhoneFocusNode;
  TextEditingController? textFieldSecretaryPhoneTextController;
  String? Function(BuildContext, String?)?
      textFieldSecretaryPhoneTextControllerValidator;
  // State field(s) for TextFieldWebsite widget.
  FocusNode? textFieldWebsiteFocusNode;
  TextEditingController? textFieldWebsiteTextController;
  String? Function(BuildContext, String?)?
      textFieldWebsiteTextControllerValidator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode1;
  TextEditingController? textController8;
  String? Function(BuildContext, String?)? textController8Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode2;
  TextEditingController? textController9;
  String? Function(BuildContext, String?)? textController9Validator;
  // State field(s) for TextFieldCity widget.
  FocusNode? textFieldCityFocusNode1;
  TextEditingController? textFieldCityTextController1;
  String? Function(BuildContext, String?)?
      textFieldCityTextController1Validator;
  // State field(s) for TextFieldCity widget.
  FocusNode? textFieldCityFocusNode2;
  TextEditingController? textFieldCityTextController2;
  String? Function(BuildContext, String?)?
      textFieldCityTextController2Validator;
  // State field(s) for TextFieldCity widget.
  FocusNode? textFieldCityFocusNode3;
  TextEditingController? textFieldCityTextController3;
  String? Function(BuildContext, String?)?
      textFieldCityTextController3Validator;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode3;
  TextEditingController? textController13;
  String? Function(BuildContext, String?)? textController13Validator;
  // Model for c_NavigationBar component.
  late CNavigationBarModel cNavigationBarModel;

  @override
  void initState(BuildContext context) {
    cNavigationBarModel = createModel(context, () => CNavigationBarModel());
  }

  @override
  void dispose() {
    textFieldChairmanFocusNode?.dispose();
    textFieldChairmanTextController?.dispose();

    textFieldChairmanemailFocusNode?.dispose();
    textFieldChairmanemailTextController?.dispose();

    textFieldChairmanPhoneFocusNode?.dispose();
    textFieldChairmanPhoneTextController?.dispose();

    textFieldSecretaryFocusNode?.dispose();
    textFieldSecretaryTextController?.dispose();

    textFieldSecretaryEmailFocusNode?.dispose();
    textFieldSecretaryEmailTextController?.dispose();

    textFieldSecretaryPhoneFocusNode?.dispose();
    textFieldSecretaryPhoneTextController?.dispose();

    textFieldWebsiteFocusNode?.dispose();
    textFieldWebsiteTextController?.dispose();

    textFieldFocusNode1?.dispose();
    textController8?.dispose();

    textFieldFocusNode2?.dispose();
    textController9?.dispose();

    textFieldCityFocusNode1?.dispose();
    textFieldCityTextController1?.dispose();

    textFieldCityFocusNode2?.dispose();
    textFieldCityTextController2?.dispose();

    textFieldCityFocusNode3?.dispose();
    textFieldCityTextController3?.dispose();

    textFieldFocusNode3?.dispose();
    textController13?.dispose();

    cNavigationBarModel.dispose();
  }
}
