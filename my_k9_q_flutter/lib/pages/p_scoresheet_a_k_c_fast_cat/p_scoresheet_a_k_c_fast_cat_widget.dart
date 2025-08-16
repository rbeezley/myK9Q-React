import '/backend/supabase/supabase.dart';
import '/components/c_confirm_score_a_k_c_fast_cat/c_confirm_score_a_k_c_fast_cat_widget.dart';
import '/flutter_flow/flutter_flow_choice_chips.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/flutter_flow/form_field_controller.dart';
import '/index.dart';
import 'package:easy_debounce/easy_debounce.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mask_text_input_formatter/mask_text_input_formatter.dart';
import 'package:provider/provider.dart';
import 'p_scoresheet_a_k_c_fast_cat_model.dart';
export 'p_scoresheet_a_k_c_fast_cat_model.dart';

class PScoresheetAKCFastCatWidget extends StatefulWidget {
  const PScoresheetAKCFastCatWidget({
    super.key,
    required this.ppEntryRow,
    required this.ppClassRow,
    this.ppTrialRow,
  });

  final ViewEntryClassJoinDistinctRow? ppEntryRow;
  final TblClassQueueRow? ppClassRow;
  final TblTrialQueueRow? ppTrialRow;

  static String routeName = 'p_ScoresheetAKCFastCat';
  static String routePath = '/pScoresheetAKCFastCat';

  @override
  State<PScoresheetAKCFastCatWidget> createState() =>
      _PScoresheetAKCFastCatWidgetState();
}

class _PScoresheetAKCFastCatWidgetState
    extends State<PScoresheetAKCFastCatWidget> {
  late PScoresheetAKCFastCatModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => PScoresheetAKCFastCatModel());

    // On page load action.
    SchedulerBinding.instance.addPostFrameCallback((_) async {
      FFAppState().asActivePage = 'p_ScoresheetAKCFastCat';
      safeSetState(() {});
    });

    _model.textFieldRunTimeTextController ??= TextEditingController();
    _model.textFieldRunTimeFocusNode ??= FocusNode();

    _model.textFieldRunTimeMask = MaskTextInputFormatter(mask: '##.###');
    WidgetsBinding.instance.addPostFrameCallback((_) => safeSetState(() {}));
  }

  @override
  void dispose() {
    _model.dispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    context.watch<FFAppState>();

    return GestureDetector(
      onTap: () {
        FocusScope.of(context).unfocus();
        FocusManager.instance.primaryFocus?.unfocus();
      },
      child: PopScope(
        canPop: false,
        child: Scaffold(
          key: scaffoldKey,
          backgroundColor: FlutterFlowTheme.of(context).primaryBackground,
          appBar: AppBar(
            backgroundColor: FlutterFlowTheme.of(context).appBar,
            automaticallyImplyLeading: false,
            leading: FlutterFlowIconButton(
              borderColor: Colors.transparent,
              borderRadius: 30.0,
              borderWidth: 1.0,
              buttonSize: 60.0,
              icon: Icon(
                Icons.arrow_back_rounded,
                color: FlutterFlowTheme.of(context).colorWhite,
                size: 30.0,
              ),
              onPressed: () async {
                HapticFeedback.heavyImpact();
                FFAppState().asStopButtonShown = false;
                FFAppState().asArea1Error = false;
                FFAppState().asResultError = false;
                FFAppState().asNQError = false;
                FFAppState().asEXError = false;
                FFAppState().asDQError = false;
                safeSetState(() {});
                await TblEntryQueueTable().update(
                  data: {
                    'in_ring': false,
                  },
                  matchingRows: (rows) => rows.eqOrNull(
                    'id',
                    widget.ppEntryRow?.id,
                  ),
                );

                context.pushNamed(
                  PEntryListTabsWidget.routeName,
                  queryParameters: {
                    'ppClassRow': serializeParam(
                      widget.ppClassRow,
                      ParamType.SupabaseRow,
                    ),
                    'ppTrialRow': serializeParam(
                      widget.ppTrialRow,
                      ParamType.SupabaseRow,
                    ),
                  }.withoutNulls,
                  extra: <String, dynamic>{
                    kTransitionInfoKey: TransitionInfo(
                      hasTransition: true,
                      transitionType: PageTransitionType.leftToRight,
                    ),
                  },
                );
              },
            ),
            title: Text(
              'AKC FastCat Scoresheet',
              style: FlutterFlowTheme.of(context).headlineMedium.override(
                    fontFamily:
                        FlutterFlowTheme.of(context).headlineMediumFamily,
                    color: Colors.white,
                    fontSize: 20.0,
                    letterSpacing: 0.0,
                    fontWeight: FontWeight.w500,
                    useGoogleFonts:
                        !FlutterFlowTheme.of(context).headlineMediumIsCustom,
                  ),
            ),
            actions: [],
            centerTitle: true,
            elevation: 2.0,
          ),
          body: SafeArea(
            top: true,
            child: Align(
              alignment: AlignmentDirectional(0.0, 0.0),
              child: Container(
                width: double.infinity,
                height: double.infinity,
                constraints: BoxConstraints(
                  maxWidth: 479.0,
                ),
                decoration: BoxDecoration(
                  color: FlutterFlowTheme.of(context).primaryBackground,
                ),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.max,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Padding(
                        padding:
                            EdgeInsetsDirectional.fromSTEB(8.0, 8.0, 8.0, 0.0),
                        child: Material(
                          color: Colors.transparent,
                          elevation: 1.0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8.0),
                          ),
                          child: Container(
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: FlutterFlowTheme.of(context)
                                  .secondaryBackground,
                              borderRadius: BorderRadius.circular(8.0),
                              border: Border.all(
                                color:
                                    FlutterFlowTheme.of(context).primaryBorder,
                                width: 2.0,
                              ),
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.max,
                              children: [
                                Padding(
                                  padding: EdgeInsetsDirectional.fromSTEB(
                                      4.0, 4.0, 4.0, 0.0),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.max,
                                    children: [
                                      SelectionArea(
                                          child: Text(
                                        valueOrDefault<String>(
                                          widget.ppEntryRow?.trialDate,
                                          'Trial Date',
                                        ),
                                        style: FlutterFlowTheme.of(context)
                                            .bodyMedium
                                            .override(
                                              fontFamily:
                                                  FlutterFlowTheme.of(context)
                                                      .bodyMediumFamily,
                                              letterSpacing: 0.0,
                                              useGoogleFonts:
                                                  !FlutterFlowTheme.of(context)
                                                      .bodyMediumIsCustom,
                                            ),
                                      )),
                                    ],
                                  ),
                                ),
                                Padding(
                                  padding: EdgeInsetsDirectional.fromSTEB(
                                      4.0, 4.0, 4.0, 0.0),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.max,
                                    mainAxisAlignment: MainAxisAlignment.start,
                                    children: [
                                      Padding(
                                        padding: EdgeInsetsDirectional.fromSTEB(
                                            0.0, 0.0, 4.0, 0.0),
                                        child: SelectionArea(
                                            child: Text(
                                          valueOrDefault<String>(
                                            widget.ppEntryRow?.trialNumber,
                                            'Trial Number',
                                          ),
                                          style: FlutterFlowTheme.of(context)
                                              .bodyMedium
                                              .override(
                                                fontFamily:
                                                    FlutterFlowTheme.of(context)
                                                        .bodyMediumFamily,
                                                letterSpacing: 0.0,
                                                useGoogleFonts:
                                                    !FlutterFlowTheme.of(
                                                            context)
                                                        .bodyMediumIsCustom,
                                              ),
                                        )),
                                      ),
                                      Text(
                                        ' Block: ${widget.ppEntryRow?.fastcatBlock}',
                                        style: FlutterFlowTheme.of(context)
                                            .bodyMedium
                                            .override(
                                              fontFamily:
                                                  FlutterFlowTheme.of(context)
                                                      .bodyMediumFamily,
                                              letterSpacing: 0.0,
                                              useGoogleFonts:
                                                  !FlutterFlowTheme.of(context)
                                                      .bodyMediumIsCustom,
                                            ),
                                      ),
                                    ],
                                  ),
                                ),
                                Column(
                                  mainAxisSize: MainAxisSize.max,
                                  children: [
                                    Row(
                                      mainAxisSize: MainAxisSize.max,
                                      mainAxisAlignment:
                                          MainAxisAlignment.start,
                                      children: [
                                        Padding(
                                          padding: EdgeInsets.all(8.0),
                                          child: Container(
                                            width: 60.0,
                                            height: 60.0,
                                            decoration: BoxDecoration(
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .secondary,
                                              shape: BoxShape.circle,
                                            ),
                                            alignment:
                                                AlignmentDirectional(0.0, 0.1),
                                            child: Text(
                                              valueOrDefault<String>(
                                                widget.ppEntryRow?.armband
                                                    ?.toString(),
                                                'Armband',
                                              ),
                                              textAlign: TextAlign.center,
                                              style: FlutterFlowTheme.of(
                                                      context)
                                                  .bodyMedium
                                                  .override(
                                                    fontFamily:
                                                        FlutterFlowTheme.of(
                                                                context)
                                                            .bodyMediumFamily,
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .colorWhite,
                                                    fontSize: 22.0,
                                                    letterSpacing: 0.0,
                                                    useGoogleFonts:
                                                        !FlutterFlowTheme.of(
                                                                context)
                                                            .bodyMediumIsCustom,
                                                  ),
                                            ),
                                          ),
                                        ),
                                        Column(
                                          mainAxisSize: MainAxisSize.max,
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              valueOrDefault<String>(
                                                widget.ppEntryRow?.callName,
                                                'Call Name',
                                              ),
                                              textAlign: TextAlign.center,
                                              style: FlutterFlowTheme.of(
                                                      context)
                                                  .bodyMedium
                                                  .override(
                                                    fontFamily:
                                                        FlutterFlowTheme.of(
                                                                context)
                                                            .bodyMediumFamily,
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primary,
                                                    letterSpacing: 0.0,
                                                    useGoogleFonts:
                                                        !FlutterFlowTheme.of(
                                                                context)
                                                            .bodyMediumIsCustom,
                                                  ),
                                            ),
                                            Text(
                                              valueOrDefault<String>(
                                                widget.ppEntryRow?.breed,
                                                'Breed',
                                              ),
                                              textAlign: TextAlign.center,
                                              style: FlutterFlowTheme.of(
                                                      context)
                                                  .bodyMedium
                                                  .override(
                                                    fontFamily:
                                                        FlutterFlowTheme.of(
                                                                context)
                                                            .bodyMediumFamily,
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .secondaryText,
                                                    fontSize: 12.0,
                                                    letterSpacing: 0.0,
                                                    fontWeight: FontWeight.w500,
                                                    useGoogleFonts:
                                                        !FlutterFlowTheme.of(
                                                                context)
                                                            .bodyMediumIsCustom,
                                                  ),
                                            ),
                                            Text(
                                              valueOrDefault<String>(
                                                widget.ppEntryRow?.handler,
                                                'Handler',
                                              ),
                                              textAlign: TextAlign.center,
                                              style: FlutterFlowTheme.of(
                                                      context)
                                                  .bodyMedium
                                                  .override(
                                                    fontFamily:
                                                        FlutterFlowTheme.of(
                                                                context)
                                                            .bodyMediumFamily,
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .secondaryText,
                                                    fontSize: 12.0,
                                                    letterSpacing: 0.0,
                                                    fontWeight: FontWeight.w500,
                                                    useGoogleFonts:
                                                        !FlutterFlowTheme.of(
                                                                context)
                                                            .bodyMediumIsCustom,
                                                  ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      Padding(
                        padding:
                            EdgeInsetsDirectional.fromSTEB(8.0, 8.0, 8.0, 0.0),
                        child: Material(
                          color: Colors.transparent,
                          elevation: 1.0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8.0),
                          ),
                          child: Container(
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: FlutterFlowTheme.of(context)
                                  .secondaryBackground,
                              borderRadius: BorderRadius.circular(8.0),
                              border: Border.all(
                                color:
                                    FlutterFlowTheme.of(context).primaryBorder,
                                width: 2.0,
                              ),
                            ),
                            child: Padding(
                              padding: EdgeInsets.all(8.0),
                              child: Column(
                                mainAxisSize: MainAxisSize.max,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Padding(
                                    padding: EdgeInsetsDirectional.fromSTEB(
                                        0.0, 16.0, 0.0, 0.0),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.max,
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Padding(
                                            padding:
                                                EdgeInsetsDirectional.fromSTEB(
                                                    8.0, 0.0, 8.0, 0.0),
                                            child: TextFormField(
                                              controller: _model
                                                  .textFieldRunTimeTextController,
                                              focusNode: _model
                                                  .textFieldRunTimeFocusNode,
                                              onChanged: (_) =>
                                                  EasyDebounce.debounce(
                                                '_model.textFieldRunTimeTextController',
                                                Duration(milliseconds: 100),
                                                () async {
                                                  if (_model.textFieldRunTimeTextController
                                                              .text !=
                                                          '') {
                                                    FFAppState().asArea1Error =
                                                        false;
                                                    safeSetState(() {});
                                                  } else {
                                                    FFAppState().asArea1Error =
                                                        true;
                                                    safeSetState(() {});
                                                  }
                                                },
                                              ),
                                              autofocus: false,
                                              obscureText: false,
                                              decoration: InputDecoration(
                                                isDense: true,
                                                labelText: 'Run Time (SS.HHH)',
                                                labelStyle:
                                                    FlutterFlowTheme.of(context)
                                                        .bodyMedium
                                                        .override(
                                                          fontFamily:
                                                              FlutterFlowTheme.of(
                                                                      context)
                                                                  .bodyMediumFamily,
                                                          letterSpacing: 0.0,
                                                          fontWeight:
                                                              FontWeight.w500,
                                                          useGoogleFonts:
                                                              !FlutterFlowTheme
                                                                      .of(context)
                                                                  .bodyMediumIsCustom,
                                                        ),
                                                hintText: 'Enter Run Time',
                                                enabledBorder:
                                                    OutlineInputBorder(
                                                  borderSide: BorderSide(
                                                    color: FFAppState()
                                                            .asArea1Error
                                                        ? FlutterFlowTheme.of(
                                                                context)
                                                            .error
                                                        : FlutterFlowTheme.of(
                                                                context)
                                                            .accent3,
                                                    width: 2.0,
                                                  ),
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                          12.0),
                                                ),
                                                focusedBorder:
                                                    OutlineInputBorder(
                                                  borderSide: BorderSide(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .success,
                                                    width: 2.0,
                                                  ),
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                          12.0),
                                                ),
                                                errorBorder: OutlineInputBorder(
                                                  borderSide: BorderSide(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .error,
                                                    width: 2.0,
                                                  ),
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                          12.0),
                                                ),
                                                focusedErrorBorder:
                                                    OutlineInputBorder(
                                                  borderSide: BorderSide(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .error,
                                                    width: 2.0,
                                                  ),
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                          12.0),
                                                ),
                                                filled: true,
                                                fillColor: (_model
                                                            .textFieldRunTimeFocusNode
                                                            ?.hasFocus ??
                                                        false)
                                                    ? FlutterFlowTheme.of(
                                                            context)
                                                        .primaryBackground
                                                    : FlutterFlowTheme.of(
                                                            context)
                                                        .secondaryBackground,
                                                prefixIcon: Icon(
                                                  Icons.timer_sharp,
                                                ),
                                                suffixIcon: _model
                                                        .textFieldRunTimeTextController!
                                                        .text
                                                        .isNotEmpty
                                                    ? InkWell(
                                                        onTap: () async {
                                                          _model
                                                              .textFieldRunTimeTextController
                                                              ?.clear();
                                                          if (_model.textFieldRunTimeTextController
                                                                      .text !=
                                                                  '') {
                                                            FFAppState()
                                                                    .asArea1Error =
                                                                false;
                                                            safeSetState(() {});
                                                          } else {
                                                            FFAppState()
                                                                    .asArea1Error =
                                                                true;
                                                            safeSetState(() {});
                                                          }

                                                          safeSetState(() {});
                                                        },
                                                        child: Icon(
                                                          Icons.clear,
                                                          color:
                                                              Color(0xFF757575),
                                                          size: 15.0,
                                                        ),
                                                      )
                                                    : null,
                                              ),
                                              style:
                                                  FlutterFlowTheme.of(context)
                                                      .bodyMedium
                                                      .override(
                                                        fontFamily:
                                                            FlutterFlowTheme.of(
                                                                    context)
                                                                .bodyMediumFamily,
                                                        letterSpacing: 0.0,
                                                        useGoogleFonts:
                                                            !FlutterFlowTheme
                                                                    .of(context)
                                                                .bodyMediumIsCustom,
                                                      ),
                                              textAlign: TextAlign.start,
                                              keyboardType:
                                                  TextInputType.number,
                                              validator: _model
                                                  .textFieldRunTimeTextControllerValidator
                                                  .asValidator(context),
                                              inputFormatters: [
                                                _model.textFieldRunTimeMask
                                              ],
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                      Padding(
                        padding:
                            EdgeInsetsDirectional.fromSTEB(8.0, 24.0, 8.0, 0.0),
                        child: Material(
                          color: Colors.transparent,
                          elevation: 1.0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8.0),
                          ),
                          child: Container(
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: FlutterFlowTheme.of(context)
                                  .secondaryBackground,
                              borderRadius: BorderRadius.circular(8.0),
                              border: Border.all(
                                color: FFAppState().asResultError
                                    ? FlutterFlowTheme.of(context).error
                                    : FlutterFlowTheme.of(context)
                                        .primaryBorder,
                                width: 2.0,
                              ),
                            ),
                            child: Padding(
                              padding: EdgeInsets.all(8.0),
                              child: FlutterFlowChoiceChips(
                                options: [
                                  ChipData('Qualified'),
                                  ChipData('NQ'),
                                  ChipData('Absent'),
                                  ChipData('EX'),
                                  ChipData('WD')
                                ],
                                onChanged: (val) async {
                                  safeSetState(() => _model
                                      .choiceChipsAKCValue = val?.firstOrNull);
                                  HapticFeedback.heavyImpact();
                                },
                                selectedChipStyle: ChipStyle(
                                  backgroundColor: FlutterFlowTheme.of(context)
                                      .backgroundComponents,
                                  textStyle: FlutterFlowTheme.of(context)
                                      .bodySmall
                                      .override(
                                        font: GoogleFonts.poppins(
                                          fontWeight: FontWeight.w500,
                                          fontStyle:
                                              FlutterFlowTheme.of(context)
                                                  .bodySmall
                                                  .fontStyle,
                                        ),
                                        color: FlutterFlowTheme.of(context)
                                            .colorWhite,
                                        letterSpacing: 0.0,
                                        fontWeight: FontWeight.w500,
                                        fontStyle: FlutterFlowTheme.of(context)
                                            .bodySmall
                                            .fontStyle,
                                      ),
                                  iconColor:
                                      FlutterFlowTheme.of(context).colorWhite,
                                  iconSize: 0.0,
                                  labelPadding: EdgeInsets.all(4.0),
                                  elevation: 3.0,
                                  borderRadius: BorderRadius.circular(12.0),
                                ),
                                unselectedChipStyle: ChipStyle(
                                  backgroundColor: FlutterFlowTheme.of(context)
                                      .primaryBackground,
                                  textStyle: FlutterFlowTheme.of(context)
                                      .bodySmall
                                      .override(
                                        fontFamily: FlutterFlowTheme.of(context)
                                            .bodySmallFamily,
                                        color: FlutterFlowTheme.of(context)
                                            .secondaryText,
                                        letterSpacing: 0.0,
                                        fontWeight: FontWeight.w500,
                                        useGoogleFonts:
                                            !FlutterFlowTheme.of(context)
                                                .bodySmallIsCustom,
                                      ),
                                  iconColor: FlutterFlowTheme.of(context)
                                      .secondaryText,
                                  iconSize: 15.0,
                                  labelPadding: EdgeInsets.all(4.0),
                                  elevation: 1.0,
                                  borderRadius: BorderRadius.circular(12.0),
                                ),
                                chipSpacing: 16.0,
                                rowSpacing: 16.0,
                                multiselect: false,
                                alignment: WrapAlignment.spaceEvenly,
                                controller:
                                    _model.choiceChipsAKCValueController ??=
                                        FormFieldController<List<String>>(
                                  [],
                                ),
                                wrapped: true,
                              ),
                            ),
                          ),
                        ),
                      ),
                      Divider(
                        height: 1.0,
                        thickness: 1.0,
                        color: FlutterFlowTheme.of(context).lineColor,
                      ),
                      Padding(
                        padding:
                            EdgeInsetsDirectional.fromSTEB(8.0, 24.0, 8.0, 8.0),
                        child: Row(
                          mainAxisSize: MainAxisSize.max,
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            FFButtonWidget(
                              onPressed: () async {
                                HapticFeedback.heavyImpact();
                                FFAppState().asStopButtonShown = false;
                                FFAppState().asArea1Error = false;
                                FFAppState().asResultError = false;
                                FFAppState().asNQError = false;
                                FFAppState().asEXError = false;
                                FFAppState().asDQError = false;
                                safeSetState(() {});
                                await TblEntryQueueTable().update(
                                  data: {
                                    'in_ring': false,
                                  },
                                  matchingRows: (rows) => rows.eqOrNull(
                                    'id',
                                    widget.ppEntryRow?.id,
                                  ),
                                );

                                context.pushNamed(
                                  PEntryListTabsWidget.routeName,
                                  queryParameters: {
                                    'ppClassRow': serializeParam(
                                      widget.ppClassRow,
                                      ParamType.SupabaseRow,
                                    ),
                                    'ppTrialRow': serializeParam(
                                      widget.ppTrialRow,
                                      ParamType.SupabaseRow,
                                    ),
                                  }.withoutNulls,
                                  extra: <String, dynamic>{
                                    kTransitionInfoKey: TransitionInfo(
                                      hasTransition: true,
                                      transitionType:
                                          PageTransitionType.leftToRight,
                                    ),
                                  },
                                );
                              },
                              text: 'Cancel',
                              options: FFButtonOptions(
                                width: 140.0,
                                height: 40.0,
                                padding: EdgeInsetsDirectional.fromSTEB(
                                    0.0, 0.0, 0.0, 0.0),
                                iconPadding: EdgeInsetsDirectional.fromSTEB(
                                    0.0, 0.0, 0.0, 0.0),
                                color: FlutterFlowTheme.of(context)
                                    .secondaryBackground,
                                textStyle: FlutterFlowTheme.of(context)
                                    .titleSmall
                                    .override(
                                      fontFamily: FlutterFlowTheme.of(context)
                                          .titleSmallFamily,
                                      color: FlutterFlowTheme.of(context)
                                          .primaryText,
                                      fontSize: 16.0,
                                      letterSpacing: 0.0,
                                      fontWeight: FontWeight.normal,
                                      useGoogleFonts:
                                          !FlutterFlowTheme.of(context)
                                              .titleSmallIsCustom,
                                    ),
                                elevation: 2.0,
                                borderSide: BorderSide(
                                  color: FlutterFlowTheme.of(context).primary,
                                  width: 1.0,
                                ),
                                borderRadius: BorderRadius.circular(40.0),
                              ),
                            ),
                            Builder(
                              builder: (context) => FFButtonWidget(
                                onPressed: () async {
                                  HapticFeedback.heavyImpact();
                                  if (_model.choiceChipsAKCValue ==
                                      'Qualified') {
                                    if (_model.textFieldRunTimeTextController
                                                .text !=
                                            '') {
                                      FFAppState().asArea1Error = false;
                                      FFAppState().asArea1Value = _model
                                          .textFieldRunTimeTextController.text;
                                      FFAppState().asResultError = false;
                                      safeSetState(() {});
                                    } else {
                                      FFAppState().asArea1Error = true;
                                      FFAppState().asResultError = false;
                                      safeSetState(() {});
                                      return;
                                    }
                                  } else if (_model.choiceChipsAKCValue ==
                                      'NQ') {
                                    if (_model.choiceChipsAKCValue != null &&
                                        _model.choiceChipsAKCValue != '') {
                                      FFAppState().asNQError = false;
                                      FFAppState().asArea1Value = '00.000';
                                      safeSetState(() {});
                                    } else {
                                      FFAppState().asNQError = true;
                                      safeSetState(() {});
                                      return;
                                    }
                                  } else if (_model.choiceChipsAKCValue ==
                                      'Absent') {
                                  } else if (_model.choiceChipsAKCValue ==
                                      'EX') {
                                    if (_model.choiceChipsAKCValue != null &&
                                        _model.choiceChipsAKCValue != '') {
                                      FFAppState().asEXError = false;
                                      FFAppState().asArea1Value = '00.000';
                                      safeSetState(() {});
                                    } else {
                                      FFAppState().asEXError = true;
                                      safeSetState(() {});
                                      return;
                                    }
                                  } else if (_model.choiceChipsAKCValue ==
                                      'WD') {
                                    if (_model.choiceChipsAKCValue != null &&
                                        _model.choiceChipsAKCValue != '') {
                                      FFAppState().asDQError = false;
                                      FFAppState().asArea1Value = '00.000';
                                      safeSetState(() {});
                                    } else {
                                      FFAppState().asDQError = true;
                                      FFAppState().asArea1Value = '00.000';
                                      safeSetState(() {});
                                      return;
                                    }
                                  } else {
                                    FFAppState().asResultError = true;
                                    safeSetState(() {});
                                    return;
                                  }

                                  // Confirm Score Dialog
                                  await showDialog(
                                    context: context,
                                    builder: (dialogContext) {
                                      return Dialog(
                                        elevation: 0,
                                        insetPadding: EdgeInsets.zero,
                                        backgroundColor: Colors.transparent,
                                        alignment:
                                            AlignmentDirectional(0.0, 0.0)
                                                .resolve(
                                                    Directionality.of(context)),
                                        child: GestureDetector(
                                          onTap: () {
                                            FocusScope.of(dialogContext)
                                                .unfocus();
                                            FocusManager.instance.primaryFocus
                                                ?.unfocus();
                                          },
                                          child: CConfirmScoreAKCFastCatWidget(
                                            cpResult:
                                                _model.choiceChipsAKCValue!,
                                            cpClassRow: widget.ppClassRow!,
                                            cpTrialRow: widget.ppTrialRow!,
                                            cpEntryRow: widget.ppEntryRow!,
                                            cpArea1: valueOrDefault<String>(
                                              FFAppState().asArea1Value,
                                              '00.000',
                                            ),
                                            cpArmband:
                                                widget.ppEntryRow!.armband!,
                                          ),
                                        ),
                                      );
                                    },
                                  );
                                },
                                text: 'Save',
                                options: FFButtonOptions(
                                  width: 140.0,
                                  height: 40.0,
                                  padding: EdgeInsetsDirectional.fromSTEB(
                                      0.0, 0.0, 0.0, 0.0),
                                  iconPadding: EdgeInsetsDirectional.fromSTEB(
                                      0.0, 0.0, 0.0, 0.0),
                                  color: FlutterFlowTheme.of(context)
                                      .backgroundComponents,
                                  textStyle: FlutterFlowTheme.of(context)
                                      .titleMedium
                                      .override(
                                        fontFamily: FlutterFlowTheme.of(context)
                                            .titleMediumFamily,
                                        color: FlutterFlowTheme.of(context)
                                            .colorWhite,
                                        fontSize: 16.0,
                                        letterSpacing: 0.0,
                                        useGoogleFonts:
                                            !FlutterFlowTheme.of(context)
                                                .titleMediumIsCustom,
                                      ),
                                  elevation: 2.0,
                                  borderRadius: BorderRadius.circular(40.0),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
