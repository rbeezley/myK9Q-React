import '/backend/supabase/supabase.dart';
import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/flutter_flow/custom_functions.dart' as functions;
import 'package:easy_debounce/easy_debounce.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:mask_text_input_formatter/mask_text_input_formatter.dart';
import 'package:provider/provider.dart';
import 'c_class_requirements_a_k_c_model.dart';
export 'c_class_requirements_a_k_c_model.dart';

class CClassRequirementsAKCWidget extends StatefulWidget {
  const CClassRequirementsAKCWidget({
    super.key,
    required this.cpClassRow,
    this.cpTrialRow,
  });

  final TblClassQueueRow? cpClassRow;
  final TblTrialQueueRow? cpTrialRow;

  @override
  State<CClassRequirementsAKCWidget> createState() =>
      _CClassRequirementsAKCWidgetState();
}

class _CClassRequirementsAKCWidgetState
    extends State<CClassRequirementsAKCWidget> with TickerProviderStateMixin {
  late CClassRequirementsAKCModel _model;

  final animationsMap = <String, AnimationInfo>{};

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => CClassRequirementsAKCModel());

    // On component load action.
    SchedulerBinding.instance.addPostFrameCallback((_) async {
      if (widget.cpClassRow?.element == 'Container') {
        FFAppState().asReadOnly = true;
        safeSetState(() {});
      } else if (widget.cpClassRow?.element == 'Buried') {
        FFAppState().asReadOnly = true;
        safeSetState(() {});
      } else if ((widget.cpClassRow?.element == 'Handler Discrimination') &&
          (widget.cpClassRow?.level == 'Novice')) {
        FFAppState().asReadOnly = true;
        safeSetState(() {});
      } else {
        FFAppState().asReadOnly = false;
        safeSetState(() {});
      }

      if (FFAppState().asRole == 'Exhibitor') {
        FFAppState().asReadOnly = true;
        safeSetState(() {});
      }
    });

    _model.textFieldMaxTime1FocusNode ??= FocusNode();

    _model.textFieldMaxTime1Mask = MaskTextInputFormatter(mask: '##:##');

    _model.textFieldMaxTime2FocusNode ??= FocusNode();

    _model.textFieldMaxTime2Mask = MaskTextInputFormatter(mask: '##:##');

    _model.textFieldMaxTime3FocusNode ??= FocusNode();

    _model.textFieldMaxTime3Mask = MaskTextInputFormatter(mask: '##:##');
    animationsMap.addAll({
      'containerOnPageLoadAnimation': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          FadeEffect(
            curve: Curves.easeInOut,
            delay: 100.0.ms,
            duration: 600.0.ms,
            begin: 0.0,
            end: 1.0,
          ),
          TiltEffect(
            curve: Curves.easeInOut,
            delay: 100.0.ms,
            duration: 600.0.ms,
            begin: Offset(0, 0.698),
            end: Offset(0, 0),
          ),
        ],
      ),
    });

    WidgetsBinding.instance.addPostFrameCallback((_) => safeSetState(() {}));
  }

  @override
  void dispose() {
    _model.maybeDispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    context.watch<FFAppState>();

    return Align(
      alignment: AlignmentDirectional(0.0, 0.0),
      child: Padding(
        padding: EdgeInsets.all(8.0),
        child: Container(
          width: 300.0,
          height: 574.0,
          constraints: BoxConstraints(
            maxWidth: 600.0,
          ),
          decoration: BoxDecoration(
            color: FlutterFlowTheme.of(context).secondaryBackground,
            boxShadow: [
              BoxShadow(
                blurRadius: 4.0,
                color: Color(0x33000000),
                offset: Offset(
                  0.0,
                  2.0,
                ),
              )
            ],
            borderRadius: BorderRadius.circular(12.0),
          ),
          child: Padding(
            padding: EdgeInsets.all(8.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 8.0),
                  child: Row(
                    mainAxisSize: MainAxisSize.max,
                    children: [
                      Padding(
                        padding:
                            EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 8.0, 0.0),
                        child: Icon(
                          Icons.article_outlined,
                          color: FlutterFlowTheme.of(context).primary,
                          size: 24.0,
                        ),
                      ),
                      Text(
                        'Class Requirements',
                        textAlign: TextAlign.start,
                        style:
                            FlutterFlowTheme.of(context).labelMedium.override(
                                  fontFamily: FlutterFlowTheme.of(context)
                                      .labelMediumFamily,
                                  fontSize: 14.0,
                                  letterSpacing: 0.0,
                                  useGoogleFonts: !FlutterFlowTheme.of(context)
                                      .labelMediumIsCustom,
                                ),
                      ),
                    ],
                  ),
                ),
                Row(
                  mainAxisSize: MainAxisSize.max,
                  mainAxisAlignment: MainAxisAlignment.start,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: EdgeInsets.all(4.0),
                      child: Text(
                        '${widget.cpClassRow?.element} ${widget.cpClassRow?.level}',
                        style: FlutterFlowTheme.of(context).bodyMedium.override(
                              fontFamily:
                                  FlutterFlowTheme.of(context).bodyMediumFamily,
                              letterSpacing: 0.0,
                              useGoogleFonts: !FlutterFlowTheme.of(context)
                                  .bodyMediumIsCustom,
                            ),
                      ),
                    ),
                  ],
                ),
                Divider(
                  thickness: 1.0,
                  color: FlutterFlowTheme.of(context).accent2,
                ),
                FutureBuilder<List<TblClassQueueRow>>(
                  future: TblClassQueueTable().querySingleRow(
                    queryFn: (q) => q
                        .eqOrNull(
                          'mobile_app_lic_key',
                          FFAppState().asMobileAppLicKey,
                        )
                        .eqOrNull(
                          'trial_date',
                          widget.cpClassRow?.trialDate,
                        )
                        .eqOrNull(
                          'trial_number',
                          widget.cpClassRow?.trialNumber,
                        )
                        .eqOrNull(
                          'element',
                          widget.cpClassRow?.element,
                        )
                        .eqOrNull(
                          'level',
                          widget.cpClassRow?.level,
                        ),
                  ),
                  builder: (context, snapshot) {
                    // Customize what your widget looks like when it's loading.
                    if (!snapshot.hasData) {
                      return Center(
                        child: SizedBox(
                          width: 50.0,
                          height: 50.0,
                          child: SpinKitCircle(
                            color: FlutterFlowTheme.of(context).primary,
                            size: 50.0,
                          ),
                        ),
                      );
                    }
                    List<TblClassQueueRow>
                        listViewClassMaxTimesTblClassQueueRowList =
                        snapshot.data!;

                    final listViewClassMaxTimesTblClassQueueRow =
                        listViewClassMaxTimesTblClassQueueRowList.isNotEmpty
                            ? listViewClassMaxTimesTblClassQueueRowList.first
                            : null;

                    return ListView(
                      padding: EdgeInsets.zero,
                      shrinkWrap: true,
                      scrollDirection: Axis.vertical,
                      children: [
                        Padding(
                          padding: EdgeInsetsDirectional.fromSTEB(
                              0.0, 8.0, 0.0, 8.0),
                          child: TextFormField(
                            controller:
                                _model.textFieldMaxTime1TextController ??=
                                    TextEditingController(
                              text: listViewClassMaxTimesTblClassQueueRow
                                  ?.timeLimit,
                            ),
                            focusNode: _model.textFieldMaxTime1FocusNode,
                            onChanged: (_) => EasyDebounce.debounce(
                              '_model.textFieldMaxTime1TextController',
                              Duration(milliseconds: 100),
                              () => safeSetState(() {}),
                            ),
                            autofocus: false,
                            readOnly: FFAppState().asReadOnly,
                            obscureText: false,
                            decoration: InputDecoration(
                              isDense: false,
                              labelText: 'Area 1 (MM:SS)',
                              labelStyle: FlutterFlowTheme.of(context)
                                  .bodyMedium
                                  .override(
                                    fontFamily: FlutterFlowTheme.of(context)
                                        .bodyMediumFamily,
                                    letterSpacing: 0.0,
                                    fontWeight: FontWeight.w500,
                                    useGoogleFonts:
                                        !FlutterFlowTheme.of(context)
                                            .bodyMediumIsCustom,
                                  ),
                              hintText: 'Enter Max Time for Area 1',
                              hintStyle: FlutterFlowTheme.of(context)
                                  .bodySmall
                                  .override(
                                    fontFamily: FlutterFlowTheme.of(context)
                                        .bodySmallFamily,
                                    letterSpacing: 0.0,
                                    useGoogleFonts:
                                        !FlutterFlowTheme.of(context)
                                            .bodySmallIsCustom,
                                  ),
                              enabledBorder: OutlineInputBorder(
                                borderSide: BorderSide(
                                  color: FFAppState().asArea1Error
                                      ? FlutterFlowTheme.of(context).error
                                      : FlutterFlowTheme.of(context).accent3,
                                  width: 2.0,
                                ),
                                borderRadius: BorderRadius.circular(12.0),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderSide: BorderSide(
                                  color: FlutterFlowTheme.of(context).tertiary,
                                  width: 2.0,
                                ),
                                borderRadius: BorderRadius.circular(12.0),
                              ),
                              errorBorder: OutlineInputBorder(
                                borderSide: BorderSide(
                                  color: FlutterFlowTheme.of(context).alternate,
                                  width: 2.0,
                                ),
                                borderRadius: BorderRadius.circular(12.0),
                              ),
                              focusedErrorBorder: OutlineInputBorder(
                                borderSide: BorderSide(
                                  color: FlutterFlowTheme.of(context).alternate,
                                  width: 2.0,
                                ),
                                borderRadius: BorderRadius.circular(12.0),
                              ),
                              filled: true,
                              fillColor: FlutterFlowTheme.of(context)
                                  .primaryBackground,
                              contentPadding: EdgeInsets.all(16.0),
                            ),
                            style: FlutterFlowTheme.of(context)
                                .bodyMedium
                                .override(
                                  fontFamily: FlutterFlowTheme.of(context)
                                      .bodyMediumFamily,
                                  letterSpacing: 0.0,
                                  useGoogleFonts: !FlutterFlowTheme.of(context)
                                      .bodyMediumIsCustom,
                                ),
                            textAlign: TextAlign.start,
                            keyboardType: TextInputType.number,
                            validator: _model
                                .textFieldMaxTime1TextControllerValidator
                                .asValidator(context),
                            inputFormatters: [_model.textFieldMaxTime1Mask],
                          ),
                        ),
                        if (listViewClassMaxTimesTblClassQueueRow!.areas! >= 2)
                          Padding(
                            padding: EdgeInsetsDirectional.fromSTEB(
                                0.0, 0.0, 0.0, 8.0),
                            child: TextFormField(
                              controller:
                                  _model.textFieldMaxTime2TextController ??=
                                      TextEditingController(
                                text: listViewClassMaxTimesTblClassQueueRow
                                    .timeLimit2,
                              ),
                              focusNode: _model.textFieldMaxTime2FocusNode,
                              onChanged: (_) => EasyDebounce.debounce(
                                '_model.textFieldMaxTime2TextController',
                                Duration(milliseconds: 100),
                                () => safeSetState(() {}),
                              ),
                              autofocus: false,
                              readOnly: FFAppState().asReadOnly,
                              obscureText: false,
                              decoration: InputDecoration(
                                isDense: false,
                                labelText: 'Area 2 (MM:SS)',
                                labelStyle: FlutterFlowTheme.of(context)
                                    .bodyMedium
                                    .override(
                                      fontFamily: FlutterFlowTheme.of(context)
                                          .bodyMediumFamily,
                                      letterSpacing: 0.0,
                                      fontWeight: FontWeight.w500,
                                      useGoogleFonts:
                                          !FlutterFlowTheme.of(context)
                                              .bodyMediumIsCustom,
                                    ),
                                hintText: 'Enter Max Time for Area 2',
                                hintStyle: FlutterFlowTheme.of(context)
                                    .bodySmall
                                    .override(
                                      fontFamily: FlutterFlowTheme.of(context)
                                          .bodySmallFamily,
                                      letterSpacing: 0.0,
                                      useGoogleFonts:
                                          !FlutterFlowTheme.of(context)
                                              .bodySmallIsCustom,
                                    ),
                                enabledBorder: OutlineInputBorder(
                                  borderSide: BorderSide(
                                    color: FFAppState().asArea2Error
                                        ? FlutterFlowTheme.of(context).error
                                        : FlutterFlowTheme.of(context).accent3,
                                    width: 2.0,
                                  ),
                                  borderRadius: BorderRadius.circular(12.0),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderSide: BorderSide(
                                    color:
                                        FlutterFlowTheme.of(context).tertiary,
                                    width: 2.0,
                                  ),
                                  borderRadius: BorderRadius.circular(12.0),
                                ),
                                errorBorder: OutlineInputBorder(
                                  borderSide: BorderSide(
                                    color:
                                        FlutterFlowTheme.of(context).alternate,
                                    width: 2.0,
                                  ),
                                  borderRadius: BorderRadius.circular(12.0),
                                ),
                                focusedErrorBorder: OutlineInputBorder(
                                  borderSide: BorderSide(
                                    color:
                                        FlutterFlowTheme.of(context).alternate,
                                    width: 2.0,
                                  ),
                                  borderRadius: BorderRadius.circular(12.0),
                                ),
                                filled: true,
                                fillColor: FlutterFlowTheme.of(context)
                                    .primaryBackground,
                                contentPadding: EdgeInsets.all(16.0),
                              ),
                              style: FlutterFlowTheme.of(context)
                                  .bodyMedium
                                  .override(
                                    fontFamily: FlutterFlowTheme.of(context)
                                        .bodyMediumFamily,
                                    letterSpacing: 0.0,
                                    useGoogleFonts:
                                        !FlutterFlowTheme.of(context)
                                            .bodyMediumIsCustom,
                                  ),
                              textAlign: TextAlign.start,
                              maxLines: null,
                              keyboardType: TextInputType.number,
                              validator: _model
                                  .textFieldMaxTime2TextControllerValidator
                                  .asValidator(context),
                              inputFormatters: [_model.textFieldMaxTime2Mask],
                            ),
                          ),
                        if (listViewClassMaxTimesTblClassQueueRow.areas! >= 3)
                          TextFormField(
                            controller:
                                _model.textFieldMaxTime3TextController ??=
                                    TextEditingController(
                              text: listViewClassMaxTimesTblClassQueueRow
                                  .timeLimit3,
                            ),
                            focusNode: _model.textFieldMaxTime3FocusNode,
                            onChanged: (_) => EasyDebounce.debounce(
                              '_model.textFieldMaxTime3TextController',
                              Duration(milliseconds: 100),
                              () => safeSetState(() {}),
                            ),
                            autofocus: false,
                            readOnly: FFAppState().asReadOnly,
                            obscureText: false,
                            decoration: InputDecoration(
                              isDense: false,
                              labelText: 'Area 3 (MM:SS)',
                              labelStyle: FlutterFlowTheme.of(context)
                                  .bodyMedium
                                  .override(
                                    fontFamily: FlutterFlowTheme.of(context)
                                        .bodyMediumFamily,
                                    letterSpacing: 0.0,
                                    fontWeight: FontWeight.w500,
                                    useGoogleFonts:
                                        !FlutterFlowTheme.of(context)
                                            .bodyMediumIsCustom,
                                  ),
                              hintText: 'Enter Max Time for Area 3',
                              enabledBorder: OutlineInputBorder(
                                borderSide: BorderSide(
                                  color: FFAppState().asArea3Error
                                      ? FlutterFlowTheme.of(context).error
                                      : FlutterFlowTheme.of(context).accent3,
                                  width: 2.0,
                                ),
                                borderRadius: BorderRadius.circular(12.0),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderSide: BorderSide(
                                  color: FlutterFlowTheme.of(context).tertiary,
                                  width: 2.0,
                                ),
                                borderRadius: BorderRadius.circular(12.0),
                              ),
                              errorBorder: OutlineInputBorder(
                                borderSide: BorderSide(
                                  color: FlutterFlowTheme.of(context).alternate,
                                  width: 2.0,
                                ),
                                borderRadius: BorderRadius.circular(12.0),
                              ),
                              focusedErrorBorder: OutlineInputBorder(
                                borderSide: BorderSide(
                                  color: FlutterFlowTheme.of(context).alternate,
                                  width: 2.0,
                                ),
                                borderRadius: BorderRadius.circular(12.0),
                              ),
                              filled: true,
                              fillColor: FlutterFlowTheme.of(context)
                                  .primaryBackground,
                              contentPadding: EdgeInsets.all(16.0),
                            ),
                            style: FlutterFlowTheme.of(context)
                                .bodyMedium
                                .override(
                                  fontFamily: FlutterFlowTheme.of(context)
                                      .bodyMediumFamily,
                                  letterSpacing: 0.0,
                                  useGoogleFonts: !FlutterFlowTheme.of(context)
                                      .bodyMediumIsCustom,
                                ),
                            textAlign: TextAlign.start,
                            maxLines: null,
                            keyboardType: TextInputType.number,
                            validator: _model
                                .textFieldMaxTime3TextControllerValidator
                                .asValidator(context),
                            inputFormatters: [_model.textFieldMaxTime3Mask],
                          ),
                      ],
                    );
                  },
                ),
                Divider(
                  thickness: 1.0,
                  color: FlutterFlowTheme.of(context).accent2,
                ),
                Expanded(
                  child: Padding(
                    padding: EdgeInsets.all(4.0),
                    child: FutureBuilder<List<TblAkcClassRequirementsRow>>(
                      future: TblAkcClassRequirementsTable().querySingleRow(
                        queryFn: (q) => q
                            .eqOrNull(
                              'element',
                              widget.cpClassRow?.element,
                            )
                            .eqOrNull(
                              'level',
                              widget.cpClassRow?.level,
                            ),
                      ),
                      builder: (context, snapshot) {
                        // Customize what your widget looks like when it's loading.
                        if (!snapshot.hasData) {
                          return Center(
                            child: SizedBox(
                              width: 50.0,
                              height: 50.0,
                              child: SpinKitCircle(
                                color: FlutterFlowTheme.of(context).primary,
                                size: 50.0,
                              ),
                            ),
                          );
                        }
                        List<TblAkcClassRequirementsRow>
                            listViewClassRequirementsTblAkcClassRequirementsRowList =
                            snapshot.data!;

                        final listViewClassRequirementsTblAkcClassRequirementsRow =
                            listViewClassRequirementsTblAkcClassRequirementsRowList
                                    .isNotEmpty
                                ? listViewClassRequirementsTblAkcClassRequirementsRowList
                                    .first
                                : null;

                        return ListView(
                          padding: EdgeInsets.symmetric(vertical: 4.0),
                          shrinkWrap: true,
                          scrollDirection: Axis.vertical,
                          children: [
                            Column(
                              mainAxisSize: MainAxisSize.max,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Hides: ${listViewClassRequirementsTblAkcClassRequirementsRow?.hides}',
                                  textAlign: TextAlign.start,
                                  style: FlutterFlowTheme.of(context)
                                      .bodyMedium
                                      .override(
                                        fontFamily: FlutterFlowTheme.of(context)
                                            .bodyMediumFamily,
                                        letterSpacing: 0.0,
                                        fontWeight: FontWeight.w500,
                                        useGoogleFonts:
                                            !FlutterFlowTheme.of(context)
                                                .bodyMediumIsCustom,
                                      ),
                                ),
                                Text(
                                  'Distractions: ${listViewClassRequirementsTblAkcClassRequirementsRow?.distractions}',
                                  style: FlutterFlowTheme.of(context)
                                      .bodyMedium
                                      .override(
                                        fontFamily: FlutterFlowTheme.of(context)
                                            .bodyMediumFamily,
                                        letterSpacing: 0.0,
                                        fontWeight: FontWeight.w500,
                                        useGoogleFonts:
                                            !FlutterFlowTheme.of(context)
                                                .bodyMediumIsCustom,
                                      ),
                                ),
                                Text(
                                  'Max Time: ${listViewClassRequirementsTblAkcClassRequirementsRow?.timeLimitText}',
                                  style: FlutterFlowTheme.of(context)
                                      .bodyMedium
                                      .override(
                                        fontFamily: FlutterFlowTheme.of(context)
                                            .bodyMediumFamily,
                                        letterSpacing: 0.0,
                                        fontWeight: FontWeight.w500,
                                        useGoogleFonts:
                                            !FlutterFlowTheme.of(context)
                                                .bodyMediumIsCustom,
                                      ),
                                ),
                                Text(
                                  'Required Calls: ${listViewClassRequirementsTblAkcClassRequirementsRow?.requiredCalls}',
                                  style: FlutterFlowTheme.of(context)
                                      .bodyMedium
                                      .override(
                                        fontFamily: FlutterFlowTheme.of(context)
                                            .bodyMediumFamily,
                                        letterSpacing: 0.0,
                                        fontWeight: FontWeight.w500,
                                        useGoogleFonts:
                                            !FlutterFlowTheme.of(context)
                                                .bodyMediumIsCustom,
                                      ),
                                ),
                                Text(
                                  'Areas: ${listViewClassRequirementsTblAkcClassRequirementsRow?.areaCount?.toString()}',
                                  style: FlutterFlowTheme.of(context)
                                      .bodyMedium
                                      .override(
                                        fontFamily: FlutterFlowTheme.of(context)
                                            .bodyMediumFamily,
                                        letterSpacing: 0.0,
                                        fontWeight: FontWeight.w500,
                                        useGoogleFonts:
                                            !FlutterFlowTheme.of(context)
                                                .bodyMediumIsCustom,
                                      ),
                                ),
                                Text(
                                  'Max Height: ${listViewClassRequirementsTblAkcClassRequirementsRow?.height}',
                                  style: FlutterFlowTheme.of(context)
                                      .bodyMedium
                                      .override(
                                        fontFamily: FlutterFlowTheme.of(context)
                                            .bodyMediumFamily,
                                        letterSpacing: 0.0,
                                        fontWeight: FontWeight.w500,
                                        useGoogleFonts:
                                            !FlutterFlowTheme.of(context)
                                                .bodyMediumIsCustom,
                                      ),
                                ),
                                Text(
                                  'Containers: ${listViewClassRequirementsTblAkcClassRequirementsRow?.containers}',
                                  style: FlutterFlowTheme.of(context)
                                      .bodyMedium
                                      .override(
                                        fontFamily: FlutterFlowTheme.of(context)
                                            .bodyMediumFamily,
                                        letterSpacing: 0.0,
                                        fontWeight: FontWeight.w500,
                                        useGoogleFonts:
                                            !FlutterFlowTheme.of(context)
                                                .bodyMediumIsCustom,
                                      ),
                                ),
                                Text(
                                  'Area Size: ${listViewClassRequirementsTblAkcClassRequirementsRow?.areaSize}',
                                  style: FlutterFlowTheme.of(context)
                                      .bodyMedium
                                      .override(
                                        fontFamily: FlutterFlowTheme.of(context)
                                            .bodyMediumFamily,
                                        letterSpacing: 0.0,
                                        fontWeight: FontWeight.w500,
                                        useGoogleFonts:
                                            !FlutterFlowTheme.of(context)
                                                .bodyMediumIsCustom,
                                      ),
                                ),
                              ]
                                  .divide(SizedBox(height: 4.0))
                                  .around(SizedBox(height: 4.0)),
                            ),
                          ].divide(SizedBox(height: 4.0)),
                        );
                      },
                    ),
                  ),
                ),
                Divider(
                  thickness: 1.0,
                  color: FlutterFlowTheme.of(context).accent2,
                ),
                Padding(
                  padding: EdgeInsets.all(12.0),
                  child: Row(
                    mainAxisSize: MainAxisSize.max,
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      FFButtonWidget(
                        onPressed: () async {
                          HapticFeedback.heavyImpact();
                          Navigator.pop(context);
                        },
                        text: 'Cancel',
                        options: FFButtonOptions(
                          width: 100.0,
                          height: 40.0,
                          padding: EdgeInsetsDirectional.fromSTEB(
                              0.0, 0.0, 0.0, 0.0),
                          iconPadding: EdgeInsetsDirectional.fromSTEB(
                              0.0, 0.0, 0.0, 0.0),
                          color:
                              FlutterFlowTheme.of(context).secondaryBackground,
                          textStyle: FlutterFlowTheme.of(context)
                              .bodyLarge
                              .override(
                                fontFamily: FlutterFlowTheme.of(context)
                                    .bodyLargeFamily,
                                letterSpacing: 0.0,
                                useGoogleFonts: !FlutterFlowTheme.of(context)
                                    .bodyLargeIsCustom,
                              ),
                          elevation: 2.0,
                          borderSide: BorderSide(
                            color: FlutterFlowTheme.of(context).primary,
                            width: 1.0,
                          ),
                          borderRadius: BorderRadius.circular(40.0),
                        ),
                      ),
                      FFButtonWidget(
                        onPressed: (FFAppState().asRole == 'Exhibitor')
                            ? null
                            : () async {
                                HapticFeedback.lightImpact();
                                if (functions.isMaxTimeValid(
                                    widget.cpClassRow?.element,
                                    widget.cpClassRow?.level,
                                    _model.textFieldMaxTime1TextController.text,
                                    1)) {
                                  if (functions.isMaxTimeValid(
                                      widget.cpClassRow?.element,
                                      widget.cpClassRow?.level,
                                      _model
                                          .textFieldMaxTime2TextController.text,
                                      2)) {
                                    if (functions.isMaxTimeValid(
                                        widget.cpClassRow?.element,
                                        widget.cpClassRow?.level,
                                        _model.textFieldMaxTime3TextController
                                            .text,
                                        3)) {
                                      FFAppState().asArea1Error = false;
                                      FFAppState().asArea2Error = false;
                                      FFAppState().asArea3Error = false;
                                      safeSetState(() {});
                                      await TblClassQueueTable().update(
                                        data: {
                                          'time_limit': _model
                                              .textFieldMaxTime1TextController
                                              .text,
                                          'time_limit2': _model
                                              .textFieldMaxTime2TextController
                                              .text,
                                          'time_limit3': _model
                                              .textFieldMaxTime3TextController
                                              .text,
                                        },
                                        matchingRows: (rows) => rows
                                            .eqOrNull(
                                              'mobile_app_lic_key',
                                              widget
                                                  .cpClassRow?.mobileAppLicKey,
                                            )
                                            .eqOrNull(
                                              'element',
                                              widget.cpClassRow?.element,
                                            )
                                            .eqOrNull(
                                              'level',
                                              widget.cpClassRow?.level,
                                            )
                                            .eqOrNull(
                                              'trial_date',
                                              widget.cpClassRow?.trialDate,
                                            )
                                            .eqOrNull(
                                              'trial_number',
                                              widget.cpClassRow?.trialNumber,
                                            ),
                                      );
                                      Navigator.pop(context);
                                      return;
                                    } else {
                                      FFAppState().asArea3Error = true;
                                      FFAppState().asArea1Error = false;
                                      FFAppState().asArea2Error = false;
                                      safeSetState(() {});
                                      return;
                                    }
                                  } else {
                                    FFAppState().asArea2Error = true;
                                    FFAppState().asArea1Error = false;
                                    safeSetState(() {});
                                    return;
                                  }
                                } else {
                                  FFAppState().asArea1Error = true;
                                  safeSetState(() {});
                                  return;
                                }
                              },
                        text: 'Save',
                        options: FFButtonOptions(
                          width: 100.0,
                          height: 40.0,
                          padding: EdgeInsetsDirectional.fromSTEB(
                              0.0, 0.0, 0.0, 0.0),
                          iconPadding: EdgeInsetsDirectional.fromSTEB(
                              0.0, 0.0, 0.0, 0.0),
                          color:
                              FlutterFlowTheme.of(context).backgroundComponents,
                          textStyle: FlutterFlowTheme.of(context)
                              .bodyLarge
                              .override(
                                fontFamily: FlutterFlowTheme.of(context)
                                    .bodyLargeFamily,
                                color: FlutterFlowTheme.of(context).colorWhite,
                                letterSpacing: 0.0,
                                fontWeight: FontWeight.w600,
                                useGoogleFonts: !FlutterFlowTheme.of(context)
                                    .bodyLargeIsCustom,
                              ),
                          elevation: 2.0,
                          borderRadius: BorderRadius.circular(40.0),
                          disabledColor: FlutterFlowTheme.of(context).accent2,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ).animateOnPageLoad(animationsMap['containerOnPageLoadAnimation']!),
      ),
    );
  }
}
