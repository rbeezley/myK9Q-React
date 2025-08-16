import '/backend/supabase/supabase.dart';
import '/components/c_annc_details/c_annc_details_widget.dart';
import '/components/c_annc_edit/c_annc_edit_widget.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'package:auto_size_text/auto_size_text.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:provider/provider.dart';
import 'c_annc_card_model.dart';
export 'c_annc_card_model.dart';

class CAnncCardWidget extends StatefulWidget {
  const CAnncCardWidget({
    super.key,
    this.cpAnncRow,
    this.cpCallback,
  });

  final TblAnnouncementsRow? cpAnncRow;
  final Future Function()? cpCallback;

  @override
  State<CAnncCardWidget> createState() => _CAnncCardWidgetState();
}

class _CAnncCardWidgetState extends State<CAnncCardWidget> {
  late CAnncCardModel _model;

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => CAnncCardModel());

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
      builder: (context) => InkWell(
        splashColor: Colors.transparent,
        focusColor: Colors.transparent,
        hoverColor: Colors.transparent,
        highlightColor: Colors.transparent,
        onTap: () async {
          HapticFeedback.heavyImpact();
          await showDialog(
            context: context,
            builder: (dialogContext) {
              return Dialog(
                elevation: 0,
                insetPadding: EdgeInsets.zero,
                backgroundColor: Colors.transparent,
                alignment: AlignmentDirectional(0.0, 0.0)
                    .resolve(Directionality.of(context)),
                child: CAnncDetailsWidget(
                  cpAnncRow: widget.cpAnncRow!,
                ),
              );
            },
          );
        },
        child: Container(
          width: double.infinity,
          constraints: BoxConstraints(
            maxWidth: 600.0,
          ),
          decoration: BoxDecoration(
            color: FlutterFlowTheme.of(context).secondaryBackground,
            boxShadow: [
              BoxShadow(
                blurRadius: 0.0,
                color: FlutterFlowTheme.of(context).lineColor,
                offset: Offset(
                  0.0,
                  2.0,
                ),
              )
            ],
            borderRadius: BorderRadius.circular(12.0),
            border: Border.all(
              color: FlutterFlowTheme.of(context).lineColor,
              width: 2.0,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.max,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: EdgeInsets.all(8.0),
                child: Row(
                  mainAxisSize: MainAxisSize.max,
                  children: [
                    Expanded(
                      child: Text(
                        valueOrDefault<String>(
                          widget.cpAnncRow?.subject,
                          '-',
                        ),
                        style: FlutterFlowTheme.of(context).bodySmall.override(
                              fontFamily:
                                  FlutterFlowTheme.of(context).bodySmallFamily,
                              color: FlutterFlowTheme.of(context).primaryText,
                              letterSpacing: 0.0,
                              fontWeight: FontWeight.w600,
                              useGoogleFonts: !FlutterFlowTheme.of(context)
                                  .bodySmallIsCustom,
                            ),
                      ),
                    ),
                  ],
                ),
              ),
              Divider(
                color: FlutterFlowTheme.of(context).lineColor,
              ),
              Padding(
                padding: EdgeInsets.all(8.0),
                child: AutoSizeText(
                  valueOrDefault<String>(
                    widget.cpAnncRow?.body,
                    '-',
                  ).maybeHandleOverflow(
                    maxChars: 120,
                    replacement: '…',
                  ),
                  maxLines: 4,
                  style: FlutterFlowTheme.of(context).bodySmall.override(
                        fontFamily:
                            FlutterFlowTheme.of(context).bodySmallFamily,
                        letterSpacing: 0.0,
                        useGoogleFonts:
                            !FlutterFlowTheme.of(context).bodySmallIsCustom,
                      ),
                ),
              ),
              Divider(
                color: FlutterFlowTheme.of(context).lineColor,
              ),
              Padding(
                padding: EdgeInsets.all(8.0),
                child: Row(
                  mainAxisSize: MainAxisSize.max,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      valueOrDefault<String>(
                        widget.cpAnncRow?.timestamp,
                        '-',
                      ),
                      style: FlutterFlowTheme.of(context).bodyMedium.override(
                            fontFamily:
                                FlutterFlowTheme.of(context).bodyMediumFamily,
                            color: FlutterFlowTheme.of(context).secondaryText,
                            letterSpacing: 0.0,
                            fontWeight: FontWeight.w500,
                            useGoogleFonts: !FlutterFlowTheme.of(context)
                                .bodyMediumIsCustom,
                          ),
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.max,
                      mainAxisAlignment: MainAxisAlignment.start,
                      children: [
                        // FFAppState().lclAnncEditSubject = listViewAnnouncementsRow.subject!;
                        //                                                                               anncEditSubjectController!.text = FFAppState().lclAnncEditSubject;
                        //                                                                               FFAppState().lclAnncEditBody = listViewAnnouncementsRow.body!;
                        //                                                                               anncEditBodyController!.text = FFAppState().lclAnncEditBody;
                        if (FFAppState().asRole != 'Exhibitor')
                          Builder(
                            builder: (context) => FlutterFlowIconButton(
                              borderColor: Colors.transparent,
                              borderRadius: 30.0,
                              borderWidth: 1.0,
                              buttonSize: 40.0,
                              icon: FaIcon(
                                FontAwesomeIcons.solidEdit,
                                color: FlutterFlowTheme.of(context).accent1,
                                size: 20.0,
                              ),
                              onPressed: () async {
                                HapticFeedback.heavyImpact();
                                await showDialog(
                                  context: context,
                                  builder: (dialogContext) {
                                    return Dialog(
                                      elevation: 0,
                                      insetPadding: EdgeInsets.zero,
                                      backgroundColor: Colors.transparent,
                                      alignment: AlignmentDirectional(0.0, 0.0)
                                          .resolve(Directionality.of(context)),
                                      child: CAnncEditWidget(
                                        cpAnncRow: widget.cpAnncRow!,
                                      ),
                                    );
                                  },
                                );
                              },
                            ),
                          ),
                        if (FFAppState().asRole != 'Exhibitor')
                          FlutterFlowIconButton(
                            borderColor: Colors.transparent,
                            borderRadius: 30.0,
                            borderWidth: 1.0,
                            buttonSize: 40.0,
                            icon: FaIcon(
                              FontAwesomeIcons.trashAlt,
                              color: FlutterFlowTheme.of(context).accent1,
                              size: 20.0,
                            ),
                            onPressed: () async {
                              HapticFeedback.lightImpact();
                              var confirmDialogResponse =
                                  await showDialog<bool>(
                                        context: context,
                                        builder: (alertDialogContext) {
                                          return AlertDialog(
                                            title: Text('Are you Sure?'),
                                            content:
                                                Text('Click Confirm to Delete'),
                                            actions: [
                                              TextButton(
                                                onPressed: () => Navigator.pop(
                                                    alertDialogContext, false),
                                                child: Text('Cancel'),
                                              ),
                                              TextButton(
                                                onPressed: () => Navigator.pop(
                                                    alertDialogContext, true),
                                                child: Text('Confirm'),
                                              ),
                                            ],
                                          );
                                        },
                                      ) ??
                                      false;
                              if (!confirmDialogResponse) {
                                return;
                              }
                              await TblAnnouncementsTable().delete(
                                matchingRows: (rows) => rows.eqOrNull(
                                  'id',
                                  widget.cpAnncRow?.id,
                                ),
                              );
                              await widget.cpCallback?.call();
                            },
                          ),
                      ],
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
