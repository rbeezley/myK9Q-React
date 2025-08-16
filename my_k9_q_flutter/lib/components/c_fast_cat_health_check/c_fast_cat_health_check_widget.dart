import '/backend/supabase/supabase.dart';
import '/flutter_flow/flutter_flow_choice_chips.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/flutter_flow/form_field_controller.dart';
import '/index.dart';
import 'package:easy_debounce/easy_debounce.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'c_fast_cat_health_check_model.dart';
export 'c_fast_cat_health_check_model.dart';

class CFastCatHealthCheckWidget extends StatefulWidget {
  const CFastCatHealthCheckWidget({
    super.key,
    required this.cpEntryRow,
    this.cpTrialRow,
    this.cpClassRow,
  });

  final ViewEntryClassJoinDistinctRow? cpEntryRow;
  final TblTrialQueueRow? cpTrialRow;
  final TblClassQueueRow? cpClassRow;

  @override
  State<CFastCatHealthCheckWidget> createState() =>
      _CFastCatHealthCheckWidgetState();
}

class _CFastCatHealthCheckWidgetState extends State<CFastCatHealthCheckWidget> {
  late CFastCatHealthCheckModel _model;

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => CFastCatHealthCheckModel());

    _model.textFieldHealthCheckCommentTextController ??=
        TextEditingController(text: widget.cpEntryRow?.fastcatHealthComment);
    _model.textFieldHealthCheckCommentFocusNode ??= FocusNode();

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
      child: Container(
        width: double.infinity,
        height: double.infinity,
        constraints: BoxConstraints(
          maxWidth: 479.0,
        ),
        decoration: BoxDecoration(
          color: FlutterFlowTheme.of(context).secondaryBackground,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.max,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Padding(
                padding: EdgeInsetsDirectional.fromSTEB(8.0, 8.0, 8.0, 0.0),
                child: Material(
                  color: Colors.transparent,
                  elevation: 1.0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8.0),
                  ),
                  child: Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: FlutterFlowTheme.of(context).secondaryBackground,
                      borderRadius: BorderRadius.circular(8.0),
                      border: Border.all(
                        color: FlutterFlowTheme.of(context).primaryBorder,
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
                                  widget.cpEntryRow?.trialDate,
                                  'Trial Date',
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
                                    widget.cpEntryRow?.trialNumber,
                                    'Trial Number',
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
                                )),
                              ),
                              Text(
                                ' Block: ${valueOrDefault<String>(
                                  widget.cpEntryRow?.fastcatBlock,
                                  'Block',
                                )}',
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
                              ),
                            ],
                          ),
                        ),
                        Column(
                          mainAxisSize: MainAxisSize.max,
                          children: [
                            Row(
                              mainAxisSize: MainAxisSize.max,
                              mainAxisAlignment: MainAxisAlignment.start,
                              children: [
                                Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Container(
                                    width: 60.0,
                                    height: 60.0,
                                    decoration: BoxDecoration(
                                      color: FlutterFlowTheme.of(context)
                                          .secondary,
                                      shape: BoxShape.circle,
                                    ),
                                    alignment: AlignmentDirectional(0.0, 0.1),
                                    child: Text(
                                      valueOrDefault<String>(
                                        widget.cpEntryRow?.armband?.toString(),
                                        '0',
                                      ),
                                      textAlign: TextAlign.center,
                                      style: FlutterFlowTheme.of(context)
                                          .bodyMedium
                                          .override(
                                            fontFamily:
                                                FlutterFlowTheme.of(context)
                                                    .bodyMediumFamily,
                                            color: FlutterFlowTheme.of(context)
                                                .colorWhite,
                                            fontSize: 22.0,
                                            letterSpacing: 0.0,
                                            useGoogleFonts:
                                                !FlutterFlowTheme.of(context)
                                                    .bodyMediumIsCustom,
                                          ),
                                    ),
                                  ),
                                ),
                                Column(
                                  mainAxisSize: MainAxisSize.max,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      valueOrDefault<String>(
                                        widget.cpEntryRow?.callName,
                                        'Call Name',
                                      ),
                                      textAlign: TextAlign.center,
                                      style: FlutterFlowTheme.of(context)
                                          .bodyMedium
                                          .override(
                                            fontFamily:
                                                FlutterFlowTheme.of(context)
                                                    .bodyMediumFamily,
                                            color: FlutterFlowTheme.of(context)
                                                .primary,
                                            letterSpacing: 0.0,
                                            useGoogleFonts:
                                                !FlutterFlowTheme.of(context)
                                                    .bodyMediumIsCustom,
                                          ),
                                    ),
                                    Text(
                                      valueOrDefault<String>(
                                        widget.cpEntryRow?.breed,
                                        'Breed',
                                      ),
                                      textAlign: TextAlign.center,
                                      style: FlutterFlowTheme.of(context)
                                          .bodyMedium
                                          .override(
                                            fontFamily:
                                                FlutterFlowTheme.of(context)
                                                    .bodyMediumFamily,
                                            color: FlutterFlowTheme.of(context)
                                                .secondaryText,
                                            fontSize: 12.0,
                                            letterSpacing: 0.0,
                                            fontWeight: FontWeight.w500,
                                            useGoogleFonts:
                                                !FlutterFlowTheme.of(context)
                                                    .bodyMediumIsCustom,
                                          ),
                                    ),
                                    Text(
                                      valueOrDefault<String>(
                                        widget.cpEntryRow?.handler,
                                        'Handler',
                                      ),
                                      textAlign: TextAlign.center,
                                      style: FlutterFlowTheme.of(context)
                                          .bodyMedium
                                          .override(
                                            fontFamily:
                                                FlutterFlowTheme.of(context)
                                                    .bodyMediumFamily,
                                            color: FlutterFlowTheme.of(context)
                                                .secondaryText,
                                            fontSize: 12.0,
                                            letterSpacing: 0.0,
                                            fontWeight: FontWeight.w500,
                                            useGoogleFonts:
                                                !FlutterFlowTheme.of(context)
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
                padding: EdgeInsetsDirectional.fromSTEB(8.0, 19.0, 8.0, 8.0),
                child: Material(
                  color: Colors.transparent,
                  elevation: 1.0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8.0),
                  ),
                  child: Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: FlutterFlowTheme.of(context).secondaryBackground,
                      borderRadius: BorderRadius.circular(8.0),
                      border: Border.all(
                        color: FFAppState().asResultError
                            ? FlutterFlowTheme.of(context).error
                            : FlutterFlowTheme.of(context).primaryBorder,
                        width: 2.0,
                      ),
                    ),
                    child: Padding(
                      padding: EdgeInsets.all(8.0),
                      child: FlutterFlowChoiceChips(
                        options: [
                          ChipData('Pass', Icons.thumb_up),
                          ChipData('In Season', Icons.thumb_down),
                          ChipData('Lame', Icons.thumb_down),
                          ChipData('Other', Icons.thumb_down)
                        ],
                        onChanged: (val) async {
                          safeSetState(() => _model
                              .choiceChipsHealthCheckValue = val?.firstOrNull);
                          HapticFeedback.heavyImpact();
                        },
                        selectedChipStyle: ChipStyle(
                          backgroundColor:
                              FlutterFlowTheme.of(context).backgroundComponents,
                          textStyle: FlutterFlowTheme.of(context)
                              .bodySmall
                              .override(
                                font: GoogleFonts.poppins(
                                  fontWeight: FontWeight.w500,
                                  fontStyle: FlutterFlowTheme.of(context)
                                      .bodySmall
                                      .fontStyle,
                                ),
                                color: FlutterFlowTheme.of(context).colorWhite,
                                letterSpacing: 0.0,
                                fontWeight: FontWeight.w500,
                                fontStyle: FlutterFlowTheme.of(context)
                                    .bodySmall
                                    .fontStyle,
                              ),
                          iconColor: FlutterFlowTheme.of(context).colorWhite,
                          iconSize: 20.0,
                          labelPadding: EdgeInsets.all(4.0),
                          elevation: 3.0,
                          borderRadius: BorderRadius.circular(12.0),
                        ),
                        unselectedChipStyle: ChipStyle(
                          backgroundColor:
                              FlutterFlowTheme.of(context).primaryBackground,
                          textStyle: FlutterFlowTheme.of(context)
                              .bodySmall
                              .override(
                                fontFamily: FlutterFlowTheme.of(context)
                                    .bodySmallFamily,
                                color:
                                    FlutterFlowTheme.of(context).secondaryText,
                                letterSpacing: 0.0,
                                fontWeight: FontWeight.w500,
                                useGoogleFonts: !FlutterFlowTheme.of(context)
                                    .bodySmallIsCustom,
                              ),
                          iconColor: FlutterFlowTheme.of(context).secondaryText,
                          iconSize: 15.0,
                          labelPadding: EdgeInsets.all(4.0),
                          elevation: 1.0,
                          borderRadius: BorderRadius.circular(12.0),
                        ),
                        chipSpacing: 8.0,
                        rowSpacing: 16.0,
                        multiselect: false,
                        alignment: WrapAlignment.spaceEvenly,
                        controller:
                            _model.choiceChipsHealthCheckValueController ??=
                                FormFieldController<List<String>>(
                          [],
                        ),
                        wrapped: true,
                      ),
                    ),
                  ),
                ),
              ),
              Padding(
                padding: EdgeInsets.all(8.0),
                child: Material(
                  color: Colors.transparent,
                  elevation: 1.0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8.0),
                  ),
                  child: Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: FlutterFlowTheme.of(context).secondaryBackground,
                      borderRadius: BorderRadius.circular(8.0),
                      border: Border.all(
                        color: FlutterFlowTheme.of(context).primaryBorder,
                        width: 2.0,
                      ),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.max,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: EdgeInsetsDirectional.fromSTEB(
                              0.0, 8.0, 0.0, 8.0),
                          child: Row(
                            mainAxisSize: MainAxisSize.max,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Padding(
                                  padding: EdgeInsetsDirectional.fromSTEB(
                                      8.0, 0.0, 8.0, 0.0),
                                  child: TextFormField(
                                    controller: _model
                                        .textFieldHealthCheckCommentTextController,
                                    focusNode: _model
                                        .textFieldHealthCheckCommentFocusNode,
                                    onChanged: (_) => EasyDebounce.debounce(
                                      '_model.textFieldHealthCheckCommentTextController',
                                      Duration(milliseconds: 100),
                                      () async {
                                        if (_model.textFieldHealthCheckCommentTextController
                                                    .text !=
                                                '') {
                                          FFAppState().asArea1Error = false;
                                          safeSetState(() {});
                                        } else {
                                          FFAppState().asArea1Error = true;
                                          safeSetState(() {});
                                        }
                                      },
                                    ),
                                    autofocus: false,
                                    obscureText: false,
                                    decoration: InputDecoration(
                                      isDense: true,
                                      labelText: 'Comment (Optional)',
                                      labelStyle: FlutterFlowTheme.of(context)
                                          .bodyMedium
                                          .override(
                                            fontFamily:
                                                FlutterFlowTheme.of(context)
                                                    .bodyMediumFamily,
                                            letterSpacing: 0.0,
                                            fontWeight: FontWeight.w500,
                                            useGoogleFonts:
                                                !FlutterFlowTheme.of(context)
                                                    .bodyMediumIsCustom,
                                          ),
                                      hintText: 'Enter Comment',
                                      enabledBorder: OutlineInputBorder(
                                        borderSide: BorderSide(
                                          color: FFAppState().asArea1Error
                                              ? FlutterFlowTheme.of(context)
                                                  .error
                                              : FlutterFlowTheme.of(context)
                                                  .accent3,
                                          width: 2.0,
                                        ),
                                        borderRadius:
                                            BorderRadius.circular(12.0),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderSide: BorderSide(
                                          color: FlutterFlowTheme.of(context)
                                              .success,
                                          width: 2.0,
                                        ),
                                        borderRadius:
                                            BorderRadius.circular(12.0),
                                      ),
                                      errorBorder: OutlineInputBorder(
                                        borderSide: BorderSide(
                                          color: FlutterFlowTheme.of(context)
                                              .error,
                                          width: 2.0,
                                        ),
                                        borderRadius:
                                            BorderRadius.circular(12.0),
                                      ),
                                      focusedErrorBorder: OutlineInputBorder(
                                        borderSide: BorderSide(
                                          color: FlutterFlowTheme.of(context)
                                              .error,
                                          width: 2.0,
                                        ),
                                        borderRadius:
                                            BorderRadius.circular(12.0),
                                      ),
                                      filled: true,
                                      fillColor: FlutterFlowTheme.of(context)
                                          .primaryBackground,
                                      suffixIcon: _model
                                              .textFieldHealthCheckCommentTextController!
                                              .text
                                              .isNotEmpty
                                          ? InkWell(
                                              onTap: () async {
                                                _model
                                                    .textFieldHealthCheckCommentTextController
                                                    ?.clear();
                                                if (_model.textFieldHealthCheckCommentTextController
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

                                                safeSetState(() {});
                                              },
                                              child: Icon(
                                                Icons.clear,
                                                color: Color(0xFF757575),
                                                size: 15.0,
                                              ),
                                            )
                                          : null,
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
                                    textAlign: TextAlign.start,
                                    validator: _model
                                        .textFieldHealthCheckCommentTextControllerValidator
                                        .asValidator(context),
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
              Divider(
                height: 1.0,
                thickness: 1.0,
                color: FlutterFlowTheme.of(context).lineColor,
              ),
              Padding(
                padding: EdgeInsetsDirectional.fromSTEB(8.0, 24.0, 8.0, 8.0),
                child: Row(
                  mainAxisSize: MainAxisSize.max,
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    FFButtonWidget(
                      onPressed: () async {
                        HapticFeedback.heavyImpact();

                        context.pushNamed(
                          PEntryListTabsWidget.routeName,
                          queryParameters: {
                            'ppClassRow': serializeParam(
                              widget.cpClassRow,
                              ParamType.SupabaseRow,
                            ),
                            'ppTrialRow': serializeParam(
                              widget.cpTrialRow,
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
                      text: 'Cancel',
                      options: FFButtonOptions(
                        width: 140.0,
                        height: 40.0,
                        padding:
                            EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 0.0),
                        iconPadding:
                            EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 0.0),
                        color: FlutterFlowTheme.of(context).secondaryBackground,
                        textStyle: FlutterFlowTheme.of(context)
                            .titleSmall
                            .override(
                              fontFamily:
                                  FlutterFlowTheme.of(context).titleSmallFamily,
                              color: FlutterFlowTheme.of(context).primaryText,
                              fontSize: 16.0,
                              letterSpacing: 0.0,
                              fontWeight: FontWeight.normal,
                              useGoogleFonts: !FlutterFlowTheme.of(context)
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
                    FFButtonWidget(
                      onPressed: () async {
                        HapticFeedback.heavyImpact();
                        if (_model.choiceChipsHealthCheckValue == 'Pass') {
                          await TblEntryQueueTable().update(
                            data: {
                              'fastcat_health_status': true,
                              'fastcat_health_timestamp':
                                  supaSerialize<PostgresTime>(
                                      PostgresTime(getCurrentTimestamp)),
                              'fastcat_health_comment': _model
                                  .textFieldHealthCheckCommentTextController
                                  .text,
                            },
                            matchingRows: (rows) => rows.eqOrNull(
                              'id',
                              widget.cpEntryRow?.id,
                            ),
                          );
                        } else {
                          await TblEntryQueueTable().update(
                            data: {
                              'fastcat_health_status': false,
                              'fastcat_health_timestamp':
                                  supaSerialize<PostgresTime>(
                                      PostgresTime(getCurrentTimestamp)),
                              'fastcat_health_comment': _model
                                  .textFieldHealthCheckCommentTextController
                                  .text,
                            },
                            matchingRows: (rows) => rows.eqOrNull(
                              'id',
                              widget.cpEntryRow?.id,
                            ),
                          );
                        }

                        context.pushNamed(
                          PEntryListTabsWidget.routeName,
                          queryParameters: {
                            'ppClassRow': serializeParam(
                              widget.cpClassRow,
                              ParamType.SupabaseRow,
                            ),
                            'ppTrialRow': serializeParam(
                              widget.cpTrialRow,
                              ParamType.SupabaseRow,
                            ),
                          }.withoutNulls,
                        );

                        Navigator.pop(context);
                      },
                      text: 'Save',
                      options: FFButtonOptions(
                        width: 140.0,
                        height: 40.0,
                        padding:
                            EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 0.0),
                        iconPadding:
                            EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 0.0),
                        color:
                            FlutterFlowTheme.of(context).backgroundComponents,
                        textStyle: FlutterFlowTheme.of(context)
                            .titleMedium
                            .override(
                              fontFamily: FlutterFlowTheme.of(context)
                                  .titleMediumFamily,
                              color: FlutterFlowTheme.of(context).colorWhite,
                              fontSize: 16.0,
                              letterSpacing: 0.0,
                              useGoogleFonts: !FlutterFlowTheme.of(context)
                                  .titleMediumIsCustom,
                            ),
                        elevation: 2.0,
                        borderRadius: BorderRadius.circular(40.0),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
