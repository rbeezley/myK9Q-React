import '/backend/supabase/supabase.dart';
import '/components/c_class_menu/c_class_menu_widget.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/index.dart';
import 'package:aligned_dialog/aligned_dialog.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:provider/provider.dart';
import 'c_class_completed_card_model.dart';
export 'c_class_completed_card_model.dart';

class CClassCompletedCardWidget extends StatefulWidget {
  const CClassCompletedCardWidget({
    super.key,
    this.cpClassQueue,
    this.cpTrialQueue,
  });

  final TblClassQueueRow? cpClassQueue;
  final TblTrialQueueRow? cpTrialQueue;

  @override
  State<CClassCompletedCardWidget> createState() =>
      _CClassCompletedCardWidgetState();
}

class _CClassCompletedCardWidgetState extends State<CClassCompletedCardWidget> {
  late CClassCompletedCardModel _model;

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => CClassCompletedCardModel());

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

    return Padding(
      padding: EdgeInsetsDirectional.fromSTEB(8.0, 0.0, 8.0, 0.0),
      child: InkWell(
        splashColor: Colors.transparent,
        focusColor: Colors.transparent,
        hoverColor: Colors.transparent,
        highlightColor: Colors.transparent,
        onTap: () async {
          HapticFeedback.heavyImpact();

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
        },
        child: Material(
          color: Colors.transparent,
          elevation: 3.0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12.0),
          ),
          child: Container(
            width: 100.0,
            height: 100.0,
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
              mainAxisSize: MainAxisSize.max,
              children: [
                Builder(
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
                    } else if (widget.cpClassQueue?.element == 'Interior') {
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
                    } else if (widget.cpClassQueue?.element == 'Exterior') {
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
                    } else if (widget.cpClassQueue?.element == 'Container') {
                      return ClipRRect(
                        borderRadius: BorderRadius.only(
                          bottomLeft: Radius.circular(12.0),
                          bottomRight: Radius.circular(0.0),
                          topLeft: Radius.circular(12.0),
                          topRight: Radius.circular(0.0),
                        ),
                        child: Image.asset(
                          'assets/images/containers5.jpg',
                          width: 100.0,
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
                    } else if (widget.cpClassQueue?.element == 'Detective') {
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
                    } else if (widget.cpClassQueue?.element == 'Obedience') {
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
                        borderRadius: BorderRadius.only(
                          bottomLeft: Radius.circular(12.0),
                          bottomRight: Radius.circular(0.0),
                          topLeft: Radius.circular(12.0),
                          topRight: Radius.circular(0.0),
                        ),
                        child: Image.asset(
                          'assets/images/myk9q_logo_no_text_crop.png',
                          width: 100.0,
                          height: double.infinity,
                          fit: BoxFit.cover,
                        ),
                      );
                    }
                  },
                ),
                Expanded(
                  child: Padding(
                    padding: EdgeInsetsDirectional.fromSTEB(4.0, 0.0, 4.0, 0.0),
                    child: Column(
                      mainAxisSize: MainAxisSize.max,
                      mainAxisAlignment: MainAxisAlignment.start,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisSize: MainAxisSize.max,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Text(
                              '${widget.cpClassQueue?.element} ${widget.cpClassQueue?.level} ${FFAppState().asOrg == 'UKC Obedience' ? widget.cpClassQueue?.section : '  '}',
                              style: FlutterFlowTheme.of(context)
                                  .titleMedium
                                  .override(
                                    fontFamily: FlutterFlowTheme.of(context)
                                        .titleMediumFamily,
                                    fontSize: 14.0,
                                    letterSpacing: 0.0,
                                    fontWeight: FontWeight.w500,
                                    useGoogleFonts:
                                        !FlutterFlowTheme.of(context)
                                            .titleMediumIsCustom,
                                  ),
                            ),
                            Builder(
                              builder: (context) => FlutterFlowIconButton(
                                borderColor: Colors.transparent,
                                borderRadius: 30.0,
                                borderWidth: 1.0,
                                buttonSize: 40.0,
                                icon: FaIcon(
                                  FontAwesomeIcons.ellipsisV,
                                  color:
                                      FlutterFlowTheme.of(context).primaryText,
                                  size: 20.0,
                                ),
                                onPressed: () async {
                                  HapticFeedback.heavyImpact();
                                  if (FFAppState().asOrg == 'UKC Nosework') {
                                    await showAlignedDialog(
                                      context: context,
                                      isGlobal: false,
                                      avoidOverflow: true,
                                      targetAnchor: AlignmentDirectional(
                                              0.0, 0.0)
                                          .resolve(Directionality.of(context)),
                                      followerAnchor: AlignmentDirectional(
                                              1.0, 0.0)
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

                                    return;
                                  } else {
                                    FFAppState().asReadOnly = true;
                                    safeSetState(() {});
                                    if (FFAppState().asOrg ==
                                        'AKC Scent Work') {
                                      await showAlignedDialog(
                                        context: context,
                                        isGlobal: false,
                                        avoidOverflow: true,
                                        targetAnchor:
                                            AlignmentDirectional(0.0, 0.0)
                                                .resolve(
                                                    Directionality.of(context)),
                                        followerAnchor:
                                            AlignmentDirectional(1.0, 0.0)
                                                .resolve(
                                                    Directionality.of(context)),
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
                                    } else {
                                      await showAlignedDialog(
                                        context: context,
                                        isGlobal: false,
                                        avoidOverflow: true,
                                        targetAnchor:
                                            AlignmentDirectional(0.0, 0.0)
                                                .resolve(
                                                    Directionality.of(context)),
                                        followerAnchor:
                                            AlignmentDirectional(1.0, 0.0)
                                                .resolve(
                                                    Directionality.of(context)),
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

                                      return;
                                    }

                                    return;
                                  }
                                },
                              ),
                            ),
                          ],
                        ),
                        Padding(
                          padding: EdgeInsetsDirectional.fromSTEB(
                              0.0, 0.0, 4.0, 4.0),
                          child: Row(
                            mainAxisSize: MainAxisSize.max,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Judge: ${widget.cpClassQueue?.judgeName}',
                                style: FlutterFlowTheme.of(context)
                                    .bodyMedium
                                    .override(
                                      fontFamily: FlutterFlowTheme.of(context)
                                          .bodyMediumFamily,
                                      fontSize: 12.0,
                                      letterSpacing: 0.0,
                                      fontWeight: FontWeight.normal,
                                      useGoogleFonts:
                                          !FlutterFlowTheme.of(context)
                                              .bodyMediumIsCustom,
                                    ),
                              ),
                              if (widget.cpClassQueue?.selfCheckin == false)
                                FFButtonWidget(
                                  onPressed: () {
                                    print('Check-inTag pressed ...');
                                  },
                                  text: 'Check-in',
                                  icon: Icon(
                                    Icons.not_interested,
                                    size: 10.0,
                                  ),
                                  options: FFButtonOptions(
                                    height: 18.0,
                                    padding: EdgeInsets.all(4.0),
                                    iconPadding: EdgeInsetsDirectional.fromSTEB(
                                        0.0, 0.0, 0.0, 0.0),
                                    iconColor: FlutterFlowTheme.of(context)
                                        .secondaryText,
                                    color: FlutterFlowTheme.of(context).accent3,
                                    textStyle: FlutterFlowTheme.of(context)
                                        .titleSmall
                                        .override(
                                          fontFamily:
                                              FlutterFlowTheme.of(context)
                                                  .titleSmallFamily,
                                          color: FlutterFlowTheme.of(context)
                                              .secondaryText,
                                          fontSize: 4.0,
                                          letterSpacing: 0.0,
                                          fontWeight: FontWeight.w200,
                                          useGoogleFonts:
                                              !FlutterFlowTheme.of(context)
                                                  .titleSmallIsCustom,
                                        ),
                                    borderSide: BorderSide(
                                      color: Colors.transparent,
                                    ),
                                    borderRadius: BorderRadius.circular(8.0),
                                  ),
                                ),
                            ],
                          ),
                        ),
                        Padding(
                          padding: EdgeInsetsDirectional.fromSTEB(
                              0.0, 0.0, 4.0, 0.0),
                          child: Row(
                            mainAxisSize: MainAxisSize.max,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '${widget.cpClassQueue?.entryCompletedCount.toString()} of ${widget.cpClassQueue?.entryTotalCount.toString()}  Completed',
                                textAlign: TextAlign.start,
                                style: FlutterFlowTheme.of(context)
                                    .bodySmall
                                    .override(
                                      fontFamily: FlutterFlowTheme.of(context)
                                          .bodySmallFamily,
                                      fontSize: 12.0,
                                      letterSpacing: 0.0,
                                      fontWeight: FontWeight.normal,
                                      useGoogleFonts:
                                          !FlutterFlowTheme.of(context)
                                              .bodySmallIsCustom,
                                    ),
                              ),
                              if (widget.cpClassQueue?.realtimeResults ==
                                  false)
                                FFButtonWidget(
                                  onPressed: () {
                                    print('ResultsTag pressed ...');
                                  },
                                  text: 'Results',
                                  icon: Icon(
                                    Icons.not_interested,
                                    size: 10.0,
                                  ),
                                  options: FFButtonOptions(
                                    height: 18.0,
                                    padding: EdgeInsets.all(4.0),
                                    iconPadding: EdgeInsets.all(0.0),
                                    iconColor: FlutterFlowTheme.of(context)
                                        .secondaryText,
                                    color: FlutterFlowTheme.of(context).accent3,
                                    textStyle: FlutterFlowTheme.of(context)
                                        .titleSmall
                                        .override(
                                          fontFamily:
                                              FlutterFlowTheme.of(context)
                                                  .titleSmallFamily,
                                          color: FlutterFlowTheme.of(context)
                                              .secondaryText,
                                          fontSize: 4.0,
                                          letterSpacing: 0.0,
                                          fontWeight: FontWeight.w200,
                                          useGoogleFonts:
                                              !FlutterFlowTheme.of(context)
                                                  .titleSmallIsCustom,
                                        ),
                                    borderSide: BorderSide(
                                      color: Colors.transparent,
                                    ),
                                    borderRadius: BorderRadius.circular(8.0),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
