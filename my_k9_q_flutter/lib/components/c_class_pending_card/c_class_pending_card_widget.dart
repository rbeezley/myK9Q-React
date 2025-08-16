import '/backend/supabase/supabase.dart';
import '/components/c_alert_dialog_warning/c_alert_dialog_warning_widget.dart';
import '/components/c_class_max_time_a_k_c/c_class_max_time_a_k_c_widget.dart';
import '/components/c_class_menu/c_class_menu_widget.dart';
import '/components/c_class_requirements_a_k_c/c_class_requirements_a_k_c_widget.dart';
import '/components/c_class_requirements_u_k_c/c_class_requirements_u_k_c_widget.dart';
import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/custom_functions.dart' as functions;
import '/index.dart';
import 'package:aligned_dialog/aligned_dialog.dart';
import 'package:auto_size_text/auto_size_text.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:provider/provider.dart';
import 'c_class_pending_card_model.dart';
export 'c_class_pending_card_model.dart';

class CClassPendingCardWidget extends StatefulWidget {
  const CClassPendingCardWidget({
    super.key,
    this.cpViewEntry,
    this.cpClassQueue,
    this.cpTrialQueue,
  });

  final List<ViewEntryClassJoinDistinctRow>? cpViewEntry;
  final TblClassQueueRow? cpClassQueue;
  final TblTrialQueueRow? cpTrialQueue;

  @override
  State<CClassPendingCardWidget> createState() =>
      _CClassPendingCardWidgetState();
}

class _CClassPendingCardWidgetState extends State<CClassPendingCardWidget>
    with TickerProviderStateMixin {
  late CClassPendingCardModel _model;

  final animationsMap = <String, AnimationInfo>{};

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => CClassPendingCardModel());

    animationsMap.addAll({
      'containerOnPageLoadAnimation': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          MoveEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 600.0.ms,
            begin: Offset(100.0, 0.0),
            end: Offset(0.0, 0.0),
          ),
          FadeEffect(
            curve: Curves.easeInOut,
            delay: 300.0.ms,
            duration: 600.0.ms,
            begin: 0.0,
            end: 1.0,
          ),
        ],
      ),
      'iconOnPageLoadAnimation': AnimationInfo(
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 600.0.ms,
            begin: Offset(0.9, 0.9),
            end: Offset(1.0, 1.0),
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

    return Builder(
      builder: (context) => Padding(
        padding: EdgeInsetsDirectional.fromSTEB(8.0, 0.0, 8.0, 0.0),
        child: InkWell(
          splashColor: Colors.transparent,
          focusColor: Colors.transparent,
          hoverColor: Colors.transparent,
          highlightColor: Colors.transparent,
          onTap: () async {
            HapticFeedback.heavyImpact();
            if (FFAppState().asOrg == 'UKC Obedience') {
              context.pushNamed(
                PEntryListTabsSeperateSectionWidget.routeName,
                queryParameters: {
                  'ppClassRow': serializeParam(
                    widget.cpClassQueue,
                    ParamType.SupabaseRow,
                  ),
                  'ppTrialRow': serializeParam(
                    widget.cpTrialQueue,
                    ParamType.SupabaseRow,
                  ),
                }.withoutNulls,
              );

              return;
            }
            if ((FFAppState().asRole == 'Judge') ||
                (FFAppState().asRole == 'Secretary')) {
              if (functions.isTimeLimitSet(
                  widget.cpClassQueue?.areas?.toString(),
                  widget.cpClassQueue?.timeLimit,
                  widget.cpClassQueue?.timeLimit2,
                  widget.cpClassQueue?.timeLimit3)) {
                context.pushNamed(
                  PEntryListTabsWidget.routeName,
                  queryParameters: {
                    'ppClassRow': serializeParam(
                      widget.cpClassQueue,
                      ParamType.SupabaseRow,
                    ),
                    'ppTrialRow': serializeParam(
                      widget.cpTrialQueue,
                      ParamType.SupabaseRow,
                    ),
                  }.withoutNulls,
                );

                return;
              } else {
                await showDialog(
                  context: context,
                  builder: (dialogContext) {
                    return Dialog(
                      elevation: 0,
                      insetPadding: EdgeInsets.zero,
                      backgroundColor: Colors.transparent,
                      alignment: AlignmentDirectional(0.0, 0.0)
                          .resolve(Directionality.of(context)),
                      child: CAlertDialogWarningWidget(
                        cpAlertTitle: 'Max Times Missing',
                        cpAlertMessage:
                            'Max times must be entered to access the Entry List.',
                      ),
                    );
                  },
                );

                await showDialog(
                  context: context,
                  builder: (dialogContext) {
                    return Dialog(
                      elevation: 0,
                      insetPadding: EdgeInsets.zero,
                      backgroundColor: Colors.transparent,
                      alignment: AlignmentDirectional(0.0, 0.0)
                          .resolve(Directionality.of(context)),
                      child: CClassMaxTimeAKCWidget(
                        cpClassRow: widget.cpClassQueue!,
                        cpTrialRow: widget.cpTrialQueue,
                      ),
                    );
                  },
                );

                return;
              }
            } else {
              context.pushNamed(
                PEntryListTabsWidget.routeName,
                queryParameters: {
                  'ppClassRow': serializeParam(
                    widget.cpClassQueue,
                    ParamType.SupabaseRow,
                  ),
                  'ppTrialRow': serializeParam(
                    widget.cpTrialQueue,
                    ParamType.SupabaseRow,
                  ),
                }.withoutNulls,
              );

              return;
            }
          },
          child: Material(
            color: Colors.transparent,
            elevation: 1.0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12.0),
            ),
            child: Container(
              width: 400.0,
              height: 174.0,
              decoration: BoxDecoration(
                color: FlutterFlowTheme.of(context).secondaryBackground,
                boxShadow: [
                  BoxShadow(
                    color: Color(0x230E151B),
                    offset: Offset(
                      0.0,
                      2.0,
                    ),
                  )
                ],
                borderRadius: BorderRadius.circular(12.0),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 80.0,
                    height: 174.0,
                    decoration: BoxDecoration(
                      color: FlutterFlowTheme.of(context).secondaryBackground,
                      borderRadius: BorderRadius.only(
                        bottomLeft: Radius.circular(12.0),
                        bottomRight: Radius.circular(0.0),
                        topLeft: Radius.circular(12.0),
                        topRight: Radius.circular(0.0),
                      ),
                    ),
                    child: Builder(
                      builder: (context) {
                        if (widget.cpClassQueue?.element ==
                            'Handler Discrimination') {
                          return ClipRRect(
                            borderRadius: BorderRadius.only(
                              bottomLeft: Radius.circular(12.0),
                              bottomRight: Radius.circular(0.0),
                              topLeft: Radius.circular(12.0),
                              topRight: Radius.circular(0.0),
                            ),
                            child: Image.asset(
                              'assets/images/HD1.png',
                              width: 100.0,
                              height: double.infinity,
                              fit: BoxFit.cover,
                            ),
                          );
                        } else if (widget.cpClassQueue?.element == 'Buried') {
                          return ClipRRect(
                            borderRadius: BorderRadius.only(
                              bottomLeft: Radius.circular(12.0),
                              bottomRight: Radius.circular(0.0),
                              topLeft: Radius.circular(12.0),
                              topRight: Radius.circular(0.0),
                            ),
                            child: Image.asset(
                              'assets/images/buried1.jpg',
                              width: 100.0,
                              height: double.infinity,
                              fit: BoxFit.cover,
                            ),
                          );
                        } else if (widget.cpClassQueue?.element ==
                            'Interior') {
                          return ClipRRect(
                            borderRadius: BorderRadius.only(
                              bottomLeft: Radius.circular(12.0),
                              bottomRight: Radius.circular(0.0),
                              topLeft: Radius.circular(12.0),
                              topRight: Radius.circular(0.0),
                            ),
                            child: Image.asset(
                              'assets/images/Interior2.jpg',
                              width: 100.0,
                              height: double.infinity,
                              fit: BoxFit.cover,
                            ),
                          );
                        } else if (widget.cpClassQueue?.element ==
                            'Exterior') {
                          return ClipRRect(
                            borderRadius: BorderRadius.only(
                              bottomLeft: Radius.circular(12.0),
                              bottomRight: Radius.circular(0.0),
                              topLeft: Radius.circular(12.0),
                              topRight: Radius.circular(0.0),
                            ),
                            child: Image.asset(
                              'assets/images/exterior1.jpg',
                              width: 100.0,
                              height: double.infinity,
                              fit: BoxFit.cover,
                            ),
                          );
                        } else if (widget.cpClassQueue?.element ==
                            'Container') {
                          return ClipRRect(
                            borderRadius: BorderRadius.only(
                              bottomLeft: Radius.circular(12.0),
                              bottomRight: Radius.circular(0.0),
                              topLeft: Radius.circular(12.0),
                              topRight: Radius.circular(0.0),
                            ),
                            child: Image.asset(
                              'assets/images/containers5.jpg',
                              width: 75.0,
                              height: double.infinity,
                              fit: BoxFit.cover,
                            ),
                          );
                        } else if (widget.cpClassQueue?.element == 'Vehicle') {
                          return ClipRRect(
                            borderRadius: BorderRadius.only(
                              bottomLeft: Radius.circular(12.0),
                              bottomRight: Radius.circular(0.0),
                              topLeft: Radius.circular(12.0),
                              topRight: Radius.circular(0.0),
                            ),
                            child: Image.asset(
                              'assets/images/vehicle3.jpg',
                              width: 100.0,
                              height: double.infinity,
                              fit: BoxFit.cover,
                            ),
                          );
                        } else if (widget.cpClassQueue?.element ==
                            'Detective') {
                          return ClipRRect(
                            borderRadius: BorderRadius.only(
                              bottomLeft: Radius.circular(12.0),
                              bottomRight: Radius.circular(0.0),
                              topLeft: Radius.circular(12.0),
                              topRight: Radius.circular(0.0),
                            ),
                            child: Image.asset(
                              'assets/images/exterior4.jpg',
                              width: 100.0,
                              height: double.infinity,
                              fit: BoxFit.cover,
                            ),
                          );
                        } else if (widget.cpClassQueue?.element == 'Rally') {
                          return ClipRRect(
                            borderRadius: BorderRadius.only(
                              bottomLeft: Radius.circular(12.0),
                              bottomRight: Radius.circular(0.0),
                              topLeft: Radius.circular(12.0),
                              topRight: Radius.circular(0.0),
                            ),
                            child: Image.asset(
                              'assets/images/rally1.jpg',
                              width: 100.0,
                              height: double.infinity,
                              fit: BoxFit.cover,
                            ),
                          );
                        } else if (widget.cpClassQueue?.element ==
                            'Obedience') {
                          return ClipRRect(
                            borderRadius: BorderRadius.only(
                              bottomLeft: Radius.circular(12.0),
                              bottomRight: Radius.circular(0.0),
                              topLeft: Radius.circular(12.0),
                              topRight: Radius.circular(0.0),
                            ),
                            child: Image.asset(
                              'assets/images/utility.jpg',
                              width: 100.0,
                              height: double.infinity,
                              fit: BoxFit.cover,
                            ),
                          );
                        } else {
                          return ClipRRect(
                            borderRadius: BorderRadius.circular(8.0),
                            child: Image.asset(
                              'assets/images/myk9q_logo_no_text_crop.png',
                              width: 300.0,
                              height: 200.0,
                              fit: BoxFit.contain,
                            ),
                          );
                        }
                      },
                    ),
                  ),
                  Expanded(
                    child: Container(
                      width: 203.0,
                      decoration: BoxDecoration(
                        color: FlutterFlowTheme.of(context).secondaryBackground,
                      ),
                      child: Padding(
                        padding:
                            EdgeInsetsDirectional.fromSTEB(4.0, 0.0, 4.0, 0.0),
                        child: Column(
                          mainAxisSize: MainAxisSize.max,
                          mainAxisAlignment: MainAxisAlignment.start,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisSize: MainAxisSize.max,
                              mainAxisAlignment: MainAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: Padding(
                                    padding: EdgeInsetsDirectional.fromSTEB(
                                        0.0, 0.0, 4.0, 0.0),
                                    child: AutoSizeText(
                                      '${widget.cpClassQueue?.element} ${widget.cpClassQueue?.level} ${FFAppState().asOrg == 'UKC Obedience' ? widget.cpClassQueue?.section : ' '}'
                                          .maybeHandleOverflow(
                                        maxChars: 30,
                                      ),
                                      minFontSize: 12.0,
                                      style: FlutterFlowTheme.of(context)
                                          .titleMedium
                                          .override(
                                            fontFamily:
                                                FlutterFlowTheme.of(context)
                                                    .titleMediumFamily,
                                            fontSize: 14.0,
                                            letterSpacing: 0.0,
                                            fontWeight: FontWeight.w500,
                                            useGoogleFonts:
                                                !FlutterFlowTheme.of(context)
                                                    .titleMediumIsCustom,
                                          ),
                                    ),
                                  ),
                                ),
                                if (FFAppState()
                                    .asFavoriteClass
                                    .contains(widget.cpClassQueue?.id))
                                  InkWell(
                                    splashColor: Colors.transparent,
                                    focusColor: Colors.transparent,
                                    hoverColor: Colors.transparent,
                                    highlightColor: Colors.transparent,
                                    onTap: () async {
                                      FFAppState().removeFromAsFavoriteClass(
                                          widget.cpClassQueue!.id);
                                      safeSetState(() {});
                                    },
                                    child: Icon(
                                      Icons.favorite,
                                      color: FlutterFlowTheme.of(context)
                                          .alternate,
                                      size: 24.0,
                                    ),
                                  ).animateOnPageLoad(animationsMap[
                                      'iconOnPageLoadAnimation']!),
                                if (!FFAppState()
                                    .asFavoriteClass
                                    .contains(widget.cpClassQueue?.id))
                                  InkWell(
                                    splashColor: Colors.transparent,
                                    focusColor: Colors.transparent,
                                    hoverColor: Colors.transparent,
                                    highlightColor: Colors.transparent,
                                    onTap: () async {
                                      FFAppState().addToAsFavoriteClass(
                                          widget.cpClassQueue!.id);
                                      safeSetState(() {});
                                    },
                                    child: Icon(
                                      Icons.favorite_border,
                                      color:
                                          FlutterFlowTheme.of(context).accent3,
                                      size: 24.0,
                                    ),
                                  ),
                              ].divide(SizedBox(width: 8.0)),
                            ),
                            Row(
                              mainAxisSize: MainAxisSize.max,
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Padding(
                                  padding: EdgeInsetsDirectional.fromSTEB(
                                      0.0, 4.0, 0.0, 4.0),
                                  child: Text(
                                    'Judge: ${widget.cpClassQueue?.judgeName}',
                                    style: FlutterFlowTheme.of(context)
                                        .bodyMedium
                                        .override(
                                          fontFamily:
                                              FlutterFlowTheme.of(context)
                                                  .bodyMediumFamily,
                                          fontSize: 12.0,
                                          letterSpacing: 0.0,
                                          fontWeight: FontWeight.normal,
                                          useGoogleFonts:
                                              !FlutterFlowTheme.of(context)
                                                  .bodyMediumIsCustom,
                                        ),
                                  ),
                                ),
                                if (!widget.cpClassQueue!.selfCheckin!)
                                  Container(
                                    decoration: BoxDecoration(
                                      color:
                                          FlutterFlowTheme.of(context).accent3,
                                      borderRadius: BorderRadius.circular(12.0),
                                    ),
                                    child: Padding(
                                      padding: EdgeInsets.all(4.0),
                                      child: Text(
                                        'No Check-in',
                                        style: FlutterFlowTheme.of(context)
                                            .bodyMedium
                                            .override(
                                              fontFamily:
                                                  FlutterFlowTheme.of(context)
                                                      .bodyMediumFamily,
                                              fontSize: 10.0,
                                              letterSpacing: 0.0,
                                              fontWeight: FontWeight.w200,
                                              useGoogleFonts:
                                                  !FlutterFlowTheme.of(context)
                                                      .bodyMediumIsCustom,
                                            ),
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                            Row(
                              mainAxisSize: MainAxisSize.max,
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '${widget.cpClassQueue?.entryPendingCount.toString()} of ${widget.cpClassQueue?.entryTotalCount.toString()} Remaining',
                                  textAlign: TextAlign.start,
                                  style: FlutterFlowTheme.of(context)
                                      .bodySmall
                                      .override(
                                        fontFamily: FlutterFlowTheme.of(context)
                                            .bodySmallFamily,
                                        fontSize: 12.0,
                                        letterSpacing: 0.0,
                                        fontWeight: FontWeight.w200,
                                        useGoogleFonts:
                                            !FlutterFlowTheme.of(context)
                                                .bodySmallIsCustom,
                                      ),
                                ),
                                if (!widget.cpClassQueue!.realtimeResults!)
                                  Container(
                                    decoration: BoxDecoration(
                                      color:
                                          FlutterFlowTheme.of(context).accent3,
                                      borderRadius: BorderRadius.circular(12.0),
                                    ),
                                    child: Padding(
                                      padding: EdgeInsets.all(4.0),
                                      child: Text(
                                        'No Results',
                                        style: FlutterFlowTheme.of(context)
                                            .bodyMedium
                                            .override(
                                              fontFamily:
                                                  FlutterFlowTheme.of(context)
                                                      .bodyMediumFamily,
                                              fontSize: 10.0,
                                              letterSpacing: 0.0,
                                              fontWeight: FontWeight.w200,
                                              useGoogleFonts:
                                                  !FlutterFlowTheme.of(context)
                                                      .bodyMediumIsCustom,
                                            ),
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                            Container(
                              decoration: BoxDecoration(
                                color: FlutterFlowTheme.of(context)
                                    .secondaryBackground,
                              ),
                              child: Builder(
                                builder: (context) {
                                  if (FFAppState().asOrg == 'UKC Obedience') {
                                    return Column(
                                      mainAxisSize: MainAxisSize.max,
                                      children: [
                                        Divider(
                                          thickness: 1.0,
                                          color: FlutterFlowTheme.of(context)
                                              .accent4,
                                        ),
                                        Align(
                                          alignment:
                                              AlignmentDirectional(0.0, 1.0),
                                          child: Padding(
                                            padding:
                                                EdgeInsetsDirectional.fromSTEB(
                                                    0.0, 4.0, 0.0, 0.0),
                                            child: Container(
                                              width: double.infinity,
                                              height: 80.0,
                                              decoration: BoxDecoration(
                                                color:
                                                    FlutterFlowTheme.of(context)
                                                        .secondaryBackground,
                                                borderRadius:
                                                    BorderRadius.circular(0.0),
                                              ),
                                              child: Builder(
                                                builder: (context) {
                                                  final runOrderWithSection =
                                                      widget.cpViewEntry
                                                              ?.toList() ??
                                                          [];

                                                  return ListView.separated(
                                                    padding:
                                                        EdgeInsets.symmetric(
                                                            vertical: 2.0),
                                                    scrollDirection:
                                                        Axis.vertical,
                                                    itemCount:
                                                        runOrderWithSection
                                                            .length,
                                                    separatorBuilder: (_, __) =>
                                                        SizedBox(height: 2.0),
                                                    itemBuilder: (context,
                                                        runOrderWithSectionIndex) {
                                                      final runOrderWithSectionItem =
                                                          runOrderWithSection[
                                                              runOrderWithSectionIndex];
                                                      return Padding(
                                                        padding:
                                                            EdgeInsetsDirectional
                                                                .fromSTEB(
                                                                    4.0,
                                                                    0.0,
                                                                    4.0,
                                                                    0.0),
                                                        child: Row(
                                                          mainAxisSize:
                                                              MainAxisSize.max,
                                                          mainAxisAlignment:
                                                              MainAxisAlignment
                                                                  .spaceBetween,
                                                          children: [
                                                            Text(
                                                              '${runOrderWithSectionItem.armband?.toString()} - ${runOrderWithSectionItem.callName}',
                                                              style: FlutterFlowTheme
                                                                      .of(context)
                                                                  .bodyMedium
                                                                  .override(
                                                                    fontFamily:
                                                                        FlutterFlowTheme.of(context)
                                                                            .bodyMediumFamily,
                                                                    fontSize:
                                                                        12.0,
                                                                    letterSpacing:
                                                                        0.0,
                                                                    fontWeight:
                                                                        FontWeight
                                                                            .normal,
                                                                    useGoogleFonts:
                                                                        !FlutterFlowTheme.of(context)
                                                                            .bodyMediumIsCustom,
                                                                  ),
                                                            ),
                                                            if (runOrderWithSectionItem
                                                                    .inRing ??
                                                                true)
                                                              Icon(
                                                                FFIcons
                                                                    .krunningdog,
                                                                color: FlutterFlowTheme.of(
                                                                        context)
                                                                    .primaryText,
                                                                size: 20.0,
                                                              ),
                                                          ],
                                                        ),
                                                      );
                                                    },
                                                  );
                                                },
                                              ),
                                            ),
                                          ),
                                        ),
                                      ],
                                    );
                                  } else {
                                    return Column(
                                      mainAxisSize: MainAxisSize.max,
                                      children: [
                                        Divider(
                                          thickness: 1.0,
                                          color: FlutterFlowTheme.of(context)
                                              .accent4,
                                        ),
                                        Align(
                                          alignment:
                                              AlignmentDirectional(0.0, 1.0),
                                          child: Padding(
                                            padding:
                                                EdgeInsetsDirectional.fromSTEB(
                                                    0.0, 4.0, 0.0, 0.0),
                                            child: Container(
                                              width: double.infinity,
                                              height: 80.0,
                                              decoration: BoxDecoration(
                                                color:
                                                    FlutterFlowTheme.of(context)
                                                        .secondaryBackground,
                                                borderRadius:
                                                    BorderRadius.circular(12.0),
                                              ),
                                              child: Builder(
                                                builder: (context) {
                                                  final chRunOrderWithOutSection =
                                                      widget.cpViewEntry
                                                              ?.toList() ??
                                                          [];

                                                  return ListView.separated(
                                                    padding:
                                                        EdgeInsets.symmetric(
                                                            vertical: 2.0),
                                                    scrollDirection:
                                                        Axis.vertical,
                                                    itemCount:
                                                        chRunOrderWithOutSection
                                                            .length,
                                                    separatorBuilder: (_, __) =>
                                                        SizedBox(height: 2.0),
                                                    itemBuilder: (context,
                                                        chRunOrderWithOutSectionIndex) {
                                                      final chRunOrderWithOutSectionItem =
                                                          chRunOrderWithOutSection[
                                                              chRunOrderWithOutSectionIndex];
                                                      return Padding(
                                                        padding:
                                                            EdgeInsetsDirectional
                                                                .fromSTEB(
                                                                    4.0,
                                                                    0.0,
                                                                    4.0,
                                                                    0.0),
                                                        child: Row(
                                                          mainAxisSize:
                                                              MainAxisSize.max,
                                                          mainAxisAlignment:
                                                              MainAxisAlignment
                                                                  .spaceBetween,
                                                          children: [
                                                            Text(
                                                              '${chRunOrderWithOutSectionItem.armband?.toString()} - ${chRunOrderWithOutSectionItem.callName}',
                                                              style: FlutterFlowTheme
                                                                      .of(context)
                                                                  .bodyMedium
                                                                  .override(
                                                                    fontFamily:
                                                                        FlutterFlowTheme.of(context)
                                                                            .bodyMediumFamily,
                                                                    fontSize:
                                                                        12.0,
                                                                    letterSpacing:
                                                                        0.0,
                                                                    fontWeight:
                                                                        FontWeight
                                                                            .normal,
                                                                    useGoogleFonts:
                                                                        !FlutterFlowTheme.of(context)
                                                                            .bodyMediumIsCustom,
                                                                  ),
                                                            ),
                                                            if (chRunOrderWithOutSectionItem
                                                                    .inRing ??
                                                                true)
                                                              Icon(
                                                                FFIcons
                                                                    .krunningdog,
                                                                color: FlutterFlowTheme.of(
                                                                        context)
                                                                    .primaryText,
                                                                size: 20.0,
                                                              ),
                                                          ],
                                                        ),
                                                      );
                                                    },
                                                  );
                                                },
                                              ),
                                            ),
                                          ),
                                        ),
                                      ],
                                    );
                                  }
                                },
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  Builder(
                    builder: (context) => InkWell(
                      splashColor: Colors.transparent,
                      focusColor: Colors.transparent,
                      hoverColor: Colors.transparent,
                      highlightColor: Colors.transparent,
                      onTap: () async {
                        HapticFeedback.heavyImpact();
                        if (FFAppState().asOrg == 'UKC Nosework') {
                          FFAppState().asAreaCount = 1;
                          safeSetState(() {});
                          if (FFAppState().asRole == 'Exhibitor') {
                            await showDialog(
                              context: context,
                              builder: (dialogContext) {
                                return Dialog(
                                  elevation: 0,
                                  insetPadding: EdgeInsets.zero,
                                  backgroundColor: Colors.transparent,
                                  alignment: AlignmentDirectional(0.0, 0.0)
                                      .resolve(Directionality.of(context)),
                                  child: CClassRequirementsUKCWidget(
                                    cpClassRow: widget.cpClassQueue!,
                                  ),
                                );
                              },
                            );

                            return;
                          } else {
                            await showAlignedDialog(
                              context: context,
                              isGlobal: false,
                              avoidOverflow: true,
                              targetAnchor: AlignmentDirectional(0.0, 0.0)
                                  .resolve(Directionality.of(context)),
                              followerAnchor: AlignmentDirectional(1.0, 0.0)
                                  .resolve(Directionality.of(context)),
                              builder: (dialogContext) {
                                return Material(
                                  color: Colors.transparent,
                                  child: CClassMenuWidget(
                                    cpClassRow: widget.cpClassQueue!,
                                    cpTrialRow: widget.cpTrialQueue!,
                                  ),
                                );
                              },
                            );
                          }

                          return;
                        } else {
                          FFAppState().asReadOnly = false;
                          safeSetState(() {});
                          if (FFAppState().asOrg != 'AKC Scent Work') {
                            if (FFAppState().asRole == 'Exhibitor') {
                              return;
                            }

                            await showDialog(
                              context: context,
                              builder: (dialogContext) {
                                return Dialog(
                                  elevation: 0,
                                  insetPadding: EdgeInsets.zero,
                                  backgroundColor: Colors.transparent,
                                  alignment: AlignmentDirectional(1.0, 0.0)
                                      .resolve(Directionality.of(context)),
                                  child: CClassMenuWidget(
                                    cpClassRow: widget.cpClassQueue!,
                                    cpTrialRow: widget.cpTrialQueue!,
                                  ),
                                );
                              },
                            );

                            return;
                          }
                          if (FFAppState().asRole == 'Exhibitor') {
                            await showDialog(
                              context: context,
                              builder: (dialogContext) {
                                return Dialog(
                                  elevation: 0,
                                  insetPadding: EdgeInsets.zero,
                                  backgroundColor: Colors.transparent,
                                  alignment: AlignmentDirectional(0.0, 0.0)
                                      .resolve(Directionality.of(context)),
                                  child: CClassRequirementsAKCWidget(
                                    cpClassRow: widget.cpClassQueue!,
                                    cpTrialRow: widget.cpTrialQueue,
                                  ),
                                );
                              },
                            );

                            return;
                          } else {
                            await showAlignedDialog(
                              context: context,
                              isGlobal: false,
                              avoidOverflow: true,
                              targetAnchor: AlignmentDirectional(0.0, 0.0)
                                  .resolve(Directionality.of(context)),
                              followerAnchor: AlignmentDirectional(1.0, 0.0)
                                  .resolve(Directionality.of(context)),
                              builder: (dialogContext) {
                                return Material(
                                  color: Colors.transparent,
                                  child: CClassMenuWidget(
                                    cpClassRow: widget.cpClassQueue!,
                                    cpTrialRow: widget.cpTrialQueue!,
                                  ),
                                );
                              },
                            );
                          }

                          return;
                        }
                      },
                      child: Builder(
                        builder: (context) {
                          if (widget.cpClassQueue?.classStatus == 1) {
                            return Material(
                              color: Colors.transparent,
                              elevation: 1.0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.only(
                                  bottomLeft: Radius.circular(0.0),
                                  bottomRight: Radius.circular(12.0),
                                  topLeft: Radius.circular(0.0),
                                  topRight: Radius.circular(12.0),
                                ),
                              ),
                              child: Container(
                                width: 60.0,
                                height: double.infinity,
                                decoration: BoxDecoration(
                                  color: FlutterFlowTheme.of(context).gray600,
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
                                  borderRadius: BorderRadius.only(
                                    bottomLeft: Radius.circular(0.0),
                                    bottomRight: Radius.circular(12.0),
                                    topLeft: Radius.circular(0.0),
                                    topRight: Radius.circular(12.0),
                                  ),
                                ),
                                child: Column(
                                  mainAxisSize: MainAxisSize.max,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    FaIcon(
                                      FontAwesomeIcons.ellipsisH,
                                      color: FlutterFlowTheme.of(context)
                                          .colorWhite,
                                      size: 20.0,
                                    ),
                                    Icon(
                                      Icons.build,
                                      color: FlutterFlowTheme.of(context)
                                          .colorWhite,
                                      size: 20.0,
                                    ),
                                    Padding(
                                      padding: EdgeInsetsDirectional.fromSTEB(
                                          0.0, 4.0, 0.0, 0.0),
                                      child: Text(
                                        'Set Up',
                                        style: FlutterFlowTheme.of(context)
                                            .bodyMedium
                                            .override(
                                              fontFamily:
                                                  FlutterFlowTheme.of(context)
                                                      .bodyMediumFamily,
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .colorWhite,
                                              fontSize: 10.0,
                                              letterSpacing: 0.0,
                                              useGoogleFonts:
                                                  !FlutterFlowTheme.of(context)
                                                      .bodyMediumIsCustom,
                                            ),
                                      ),
                                    ),
                                    Padding(
                                      padding: EdgeInsetsDirectional.fromSTEB(
                                          4.0, 8.0, 4.0, 4.0),
                                      child: Text(
                                        valueOrDefault<String>(
                                          widget
                                              .cpClassQueue?.classStatusComment,
                                          '-',
                                        ).maybeHandleOverflow(
                                          maxChars: 30,
                                        ),
                                        textAlign: TextAlign.center,
                                        style: FlutterFlowTheme.of(context)
                                            .bodyMedium
                                            .override(
                                              fontFamily:
                                                  FlutterFlowTheme.of(context)
                                                      .bodyMediumFamily,
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .colorWhite,
                                              fontSize: 10.0,
                                              letterSpacing: 0.0,
                                              useGoogleFonts:
                                                  !FlutterFlowTheme.of(context)
                                                      .bodyMediumIsCustom,
                                            ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          } else if (widget.cpClassQueue?.classStatus == 2) {
                            return Material(
                              color: Colors.transparent,
                              elevation: 1.0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.only(
                                  bottomLeft: Radius.circular(0.0),
                                  bottomRight: Radius.circular(12.0),
                                  topLeft: Radius.circular(0.0),
                                  topRight: Radius.circular(12.0),
                                ),
                              ),
                              child: Container(
                                width: 60.0,
                                height: double.infinity,
                                decoration: BoxDecoration(
                                  color: Color(0xFF9B06EC),
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
                                  borderRadius: BorderRadius.only(
                                    bottomLeft: Radius.circular(0.0),
                                    bottomRight: Radius.circular(12.0),
                                    topLeft: Radius.circular(0.0),
                                    topRight: Radius.circular(12.0),
                                  ),
                                ),
                                child: Column(
                                  mainAxisSize: MainAxisSize.max,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    FaIcon(
                                      FontAwesomeIcons.ellipsisH,
                                      color: FlutterFlowTheme.of(context)
                                          .colorWhite,
                                      size: 20.0,
                                    ),
                                    Icon(
                                      Icons.message_outlined,
                                      color: FlutterFlowTheme.of(context)
                                          .colorWhite,
                                      size: 20.0,
                                    ),
                                    Padding(
                                      padding: EdgeInsetsDirectional.fromSTEB(
                                          0.0, 4.0, 0.0, 0.0),
                                      child: Text(
                                        'Briefing',
                                        textAlign: TextAlign.center,
                                        style: FlutterFlowTheme.of(context)
                                            .bodyMedium
                                            .override(
                                              fontFamily:
                                                  FlutterFlowTheme.of(context)
                                                      .bodyMediumFamily,
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .colorWhite,
                                              fontSize: 10.0,
                                              letterSpacing: 0.0,
                                              fontWeight: FontWeight.w300,
                                              useGoogleFonts:
                                                  !FlutterFlowTheme.of(context)
                                                      .bodyMediumIsCustom,
                                            ),
                                      ),
                                    ),
                                    Padding(
                                      padding: EdgeInsetsDirectional.fromSTEB(
                                          4.0, 8.0, 4.0, 4.0),
                                      child: Text(
                                        valueOrDefault<String>(
                                          widget
                                              .cpClassQueue?.classStatusComment,
                                          '-',
                                        ).maybeHandleOverflow(
                                          maxChars: 30,
                                        ),
                                        textAlign: TextAlign.center,
                                        style: FlutterFlowTheme.of(context)
                                            .bodyMedium
                                            .override(
                                              fontFamily:
                                                  FlutterFlowTheme.of(context)
                                                      .bodyMediumFamily,
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .colorWhite,
                                              fontSize: 10.0,
                                              letterSpacing: 0.0,
                                              useGoogleFonts:
                                                  !FlutterFlowTheme.of(context)
                                                      .bodyMediumIsCustom,
                                            ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          } else if (widget.cpClassQueue?.classStatus == 3) {
                            return Material(
                              color: Colors.transparent,
                              elevation: 1.0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.only(
                                  bottomLeft: Radius.circular(0.0),
                                  bottomRight: Radius.circular(12.0),
                                  topLeft: Radius.circular(0.0),
                                  topRight: Radius.circular(12.0),
                                ),
                              ),
                              child: Container(
                                width: 60.0,
                                height: double.infinity,
                                decoration: BoxDecoration(
                                  color: Color(0xFF49565D),
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
                                  borderRadius: BorderRadius.only(
                                    bottomLeft: Radius.circular(0.0),
                                    bottomRight: Radius.circular(12.0),
                                    topLeft: Radius.circular(0.0),
                                    topRight: Radius.circular(12.0),
                                  ),
                                ),
                                child: Column(
                                  mainAxisSize: MainAxisSize.max,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    FaIcon(
                                      FontAwesomeIcons.ellipsisH,
                                      color: FlutterFlowTheme.of(context)
                                          .colorWhite,
                                      size: 20.0,
                                    ),
                                    Icon(
                                      Icons.free_breakfast_outlined,
                                      color: FlutterFlowTheme.of(context)
                                          .colorWhite,
                                      size: 28.0,
                                    ),
                                    Padding(
                                      padding: EdgeInsetsDirectional.fromSTEB(
                                          0.0, 4.0, 0.0, 0.0),
                                      child: Text(
                                        'Break',
                                        textAlign: TextAlign.center,
                                        style: FlutterFlowTheme.of(context)
                                            .bodyMedium
                                            .override(
                                              fontFamily:
                                                  FlutterFlowTheme.of(context)
                                                      .bodyMediumFamily,
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .colorWhite,
                                              fontSize: 10.0,
                                              letterSpacing: 0.0,
                                              fontWeight: FontWeight.w300,
                                              useGoogleFonts:
                                                  !FlutterFlowTheme.of(context)
                                                      .bodyMediumIsCustom,
                                            ),
                                      ),
                                    ),
                                    Padding(
                                      padding: EdgeInsetsDirectional.fromSTEB(
                                          4.0, 8.0, 4.0, 4.0),
                                      child: Text(
                                        valueOrDefault<String>(
                                          widget
                                              .cpClassQueue?.classStatusComment,
                                          '-',
                                        ).maybeHandleOverflow(
                                          maxChars: 30,
                                        ),
                                        textAlign: TextAlign.center,
                                        style: FlutterFlowTheme.of(context)
                                            .bodyMedium
                                            .override(
                                              fontFamily:
                                                  FlutterFlowTheme.of(context)
                                                      .bodyMediumFamily,
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .colorWhite,
                                              fontSize: 10.0,
                                              letterSpacing: 0.0,
                                              useGoogleFonts:
                                                  !FlutterFlowTheme.of(context)
                                                      .bodyMediumIsCustom,
                                            ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          } else if (widget.cpClassQueue?.classStatus == 4) {
                            return Material(
                              color: Colors.transparent,
                              elevation: 1.0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.only(
                                  bottomLeft: Radius.circular(0.0),
                                  bottomRight: Radius.circular(12.0),
                                  topLeft: Radius.circular(0.0),
                                  topRight: Radius.circular(12.0),
                                ),
                              ),
                              child: Container(
                                width: 60.0,
                                height: double.infinity,
                                decoration: BoxDecoration(
                                  color: FlutterFlowTheme.of(context).tertiary,
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
                                  borderRadius: BorderRadius.only(
                                    bottomLeft: Radius.circular(0.0),
                                    bottomRight: Radius.circular(12.0),
                                    topLeft: Radius.circular(0.0),
                                    topRight: Radius.circular(12.0),
                                  ),
                                ),
                                child: Column(
                                  mainAxisSize: MainAxisSize.max,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    FaIcon(
                                      FontAwesomeIcons.ellipsisH,
                                      color: FlutterFlowTheme.of(context)
                                          .colorWhite,
                                      size: 20.0,
                                    ),
                                    Icon(
                                      Icons.access_time_rounded,
                                      color: FlutterFlowTheme.of(context)
                                          .colorWhite,
                                      size: 28.0,
                                    ),
                                    Padding(
                                      padding: EdgeInsetsDirectional.fromSTEB(
                                          0.0, 4.0, 0.0, 0.0),
                                      child: Text(
                                        'Start Time',
                                        textAlign: TextAlign.center,
                                        style: FlutterFlowTheme.of(context)
                                            .bodyMedium
                                            .override(
                                              fontFamily:
                                                  FlutterFlowTheme.of(context)
                                                      .bodyMediumFamily,
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .colorWhite,
                                              fontSize: 10.0,
                                              letterSpacing: 0.0,
                                              fontWeight: FontWeight.w300,
                                              useGoogleFonts:
                                                  !FlutterFlowTheme.of(context)
                                                      .bodyMediumIsCustom,
                                            ),
                                      ),
                                    ),
                                    Padding(
                                      padding: EdgeInsetsDirectional.fromSTEB(
                                          4.0, 8.0, 4.0, 4.0),
                                      child: Text(
                                        valueOrDefault<String>(
                                          widget
                                              .cpClassQueue?.classStatusComment,
                                          '-',
                                        ).maybeHandleOverflow(
                                          maxChars: 30,
                                        ),
                                        textAlign: TextAlign.center,
                                        style: FlutterFlowTheme.of(context)
                                            .bodyMedium
                                            .override(
                                              fontFamily:
                                                  FlutterFlowTheme.of(context)
                                                      .bodyMediumFamily,
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .colorWhite,
                                              fontSize: 10.0,
                                              letterSpacing: 0.0,
                                              useGoogleFonts:
                                                  !FlutterFlowTheme.of(context)
                                                      .bodyMediumIsCustom,
                                            ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          } else if (widget.cpClassQueue?.classStatus == 5) {
                            return Material(
                              color: Colors.transparent,
                              elevation: 1.0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.only(
                                  bottomLeft: Radius.circular(0.0),
                                  bottomRight: Radius.circular(12.0),
                                  topLeft: Radius.circular(0.0),
                                  topRight: Radius.circular(12.0),
                                ),
                              ),
                              child: Container(
                                width: 60.0,
                                height: double.infinity,
                                decoration: BoxDecoration(
                                  color: FlutterFlowTheme.of(context)
                                      .backgroundComponents,
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
                                  borderRadius: BorderRadius.only(
                                    bottomLeft: Radius.circular(0.0),
                                    bottomRight: Radius.circular(12.0),
                                    topLeft: Radius.circular(0.0),
                                    topRight: Radius.circular(12.0),
                                  ),
                                ),
                                child: Column(
                                  mainAxisSize: MainAxisSize.max,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    FaIcon(
                                      FontAwesomeIcons.ellipsisH,
                                      color: FlutterFlowTheme.of(context)
                                          .colorWhite,
                                      size: 20.0,
                                    ),
                                    Icon(
                                      FFIcons.krunningdog,
                                      color: FlutterFlowTheme.of(context)
                                          .colorWhite,
                                      size: 28.0,
                                    ),
                                    Padding(
                                      padding: EdgeInsetsDirectional.fromSTEB(
                                          0.0, 4.0, 0.0, 0.0),
                                      child: Text(
                                        'In Progress',
                                        textAlign: TextAlign.center,
                                        style: FlutterFlowTheme.of(context)
                                            .bodyMedium
                                            .override(
                                              fontFamily:
                                                  FlutterFlowTheme.of(context)
                                                      .bodyMediumFamily,
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .colorWhite,
                                              fontSize: 10.0,
                                              letterSpacing: 0.0,
                                              fontWeight: FontWeight.w300,
                                              useGoogleFonts:
                                                  !FlutterFlowTheme.of(context)
                                                      .bodyMediumIsCustom,
                                            ),
                                      ),
                                    ),
                                    Padding(
                                      padding: EdgeInsetsDirectional.fromSTEB(
                                          4.0, 8.0, 4.0, 4.0),
                                      child: Text(
                                        valueOrDefault<String>(
                                          widget
                                              .cpClassQueue?.classStatusComment,
                                          '-',
                                        ).maybeHandleOverflow(
                                          maxChars: 30,
                                        ),
                                        textAlign: TextAlign.center,
                                        style: FlutterFlowTheme.of(context)
                                            .bodyMedium
                                            .override(
                                              fontFamily:
                                                  FlutterFlowTheme.of(context)
                                                      .bodyMediumFamily,
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .colorWhite,
                                              fontSize: 10.0,
                                              letterSpacing: 0.0,
                                              useGoogleFonts:
                                                  !FlutterFlowTheme.of(context)
                                                      .bodyMediumIsCustom,
                                            ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          } else if (widget.cpClassQueue?.classStatus == 6) {
                            return Material(
                              color: Colors.transparent,
                              elevation: 1.0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.only(
                                  bottomLeft: Radius.circular(0.0),
                                  bottomRight: Radius.circular(12.0),
                                  topLeft: Radius.circular(0.0),
                                  topRight: Radius.circular(12.0),
                                ),
                              ),
                              child: Container(
                                width: 60.0,
                                height: double.infinity,
                                decoration: BoxDecoration(
                                  color: Color(0xFF005D50),
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
                                  borderRadius: BorderRadius.only(
                                    bottomLeft: Radius.circular(0.0),
                                    bottomRight: Radius.circular(12.0),
                                    topLeft: Radius.circular(0.0),
                                    topRight: Radius.circular(12.0),
                                  ),
                                ),
                                child: Column(
                                  mainAxisSize: MainAxisSize.max,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    FaIcon(
                                      FontAwesomeIcons.ellipsisH,
                                      color: FlutterFlowTheme.of(context)
                                          .colorWhite,
                                      size: 20.0,
                                    ),
                                    FaIcon(
                                      FontAwesomeIcons.flagCheckered,
                                      color: FlutterFlowTheme.of(context)
                                          .colorWhite,
                                      size: 24.0,
                                    ),
                                    Padding(
                                      padding: EdgeInsetsDirectional.fromSTEB(
                                          0.0, 4.0, 0.0, 0.0),
                                      child: Text(
                                        'Completed',
                                        textAlign: TextAlign.center,
                                        style: FlutterFlowTheme.of(context)
                                            .bodyMedium
                                            .override(
                                              fontFamily:
                                                  FlutterFlowTheme.of(context)
                                                      .bodyMediumFamily,
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .colorWhite,
                                              fontSize: 10.0,
                                              letterSpacing: 0.0,
                                              fontWeight: FontWeight.w300,
                                              useGoogleFonts:
                                                  !FlutterFlowTheme.of(context)
                                                      .bodyMediumIsCustom,
                                            ),
                                      ),
                                    ),
                                    Padding(
                                      padding: EdgeInsetsDirectional.fromSTEB(
                                          4.0, 8.0, 4.0, 4.0),
                                      child: Text(
                                        valueOrDefault<String>(
                                          widget
                                              .cpClassQueue?.classStatusComment,
                                          '-',
                                        ).maybeHandleOverflow(
                                          maxChars: 30,
                                        ),
                                        textAlign: TextAlign.center,
                                        style: FlutterFlowTheme.of(context)
                                            .bodyMedium
                                            .override(
                                              fontFamily:
                                                  FlutterFlowTheme.of(context)
                                                      .bodyMediumFamily,
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .colorWhite,
                                              fontSize: 10.0,
                                              letterSpacing: 0.0,
                                              useGoogleFonts:
                                                  !FlutterFlowTheme.of(context)
                                                      .bodyMediumIsCustom,
                                            ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          } else {
                            return Material(
                              color: Colors.transparent,
                              elevation: 1.0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.only(
                                  bottomLeft: Radius.circular(0.0),
                                  bottomRight: Radius.circular(12.0),
                                  topLeft: Radius.circular(0.0),
                                  topRight: Radius.circular(12.0),
                                ),
                              ),
                              child: Container(
                                width: 60.0,
                                height: double.infinity,
                                decoration: BoxDecoration(
                                  color: FlutterFlowTheme.of(context)
                                      .secondaryBackground,
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
                                  borderRadius: BorderRadius.only(
                                    bottomLeft: Radius.circular(0.0),
                                    bottomRight: Radius.circular(12.0),
                                    topLeft: Radius.circular(0.0),
                                    topRight: Radius.circular(12.0),
                                  ),
                                ),
                                child: Column(
                                  mainAxisSize: MainAxisSize.max,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    FaIcon(
                                      FontAwesomeIcons.ellipsisV,
                                      color: FlutterFlowTheme.of(context)
                                          .secondaryText,
                                      size: 20.0,
                                    ),
                                    Padding(
                                      padding: EdgeInsetsDirectional.fromSTEB(
                                          4.0, 8.0, 4.0, 4.0),
                                      child: Text(
                                        valueOrDefault<String>(
                                          widget
                                              .cpClassQueue?.classStatusComment,
                                          '-',
                                        ).maybeHandleOverflow(
                                          maxChars: 30,
                                        ),
                                        textAlign: TextAlign.center,
                                        style: FlutterFlowTheme.of(context)
                                            .bodyMedium
                                            .override(
                                              fontFamily:
                                                  FlutterFlowTheme.of(context)
                                                      .bodyMediumFamily,
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .secondaryText,
                                              fontSize: 10.0,
                                              letterSpacing: 0.0,
                                              useGoogleFonts:
                                                  !FlutterFlowTheme.of(context)
                                                      .bodyMediumIsCustom,
                                            ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }
                        },
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ).animateOnPageLoad(animationsMap['containerOnPageLoadAnimation']!),
      ),
    );
  }
}
