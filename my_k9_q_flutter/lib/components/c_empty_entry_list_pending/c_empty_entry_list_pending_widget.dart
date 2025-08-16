import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'c_empty_entry_list_pending_model.dart';
export 'c_empty_entry_list_pending_model.dart';

class CEmptyEntryListPendingWidget extends StatefulWidget {
  const CEmptyEntryListPendingWidget({super.key});

  @override
  State<CEmptyEntryListPendingWidget> createState() =>
      _CEmptyEntryListPendingWidgetState();
}

class _CEmptyEntryListPendingWidgetState
    extends State<CEmptyEntryListPendingWidget> {
  late CEmptyEntryListPendingModel _model;

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => CEmptyEntryListPendingModel());

    WidgetsBinding.instance.addPostFrameCallback((_) => safeSetState(() {}));
  }

  @override
  void dispose() {
    _model.maybeDispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: AlignmentDirectional(0.0, -1.0),
      child: Container(
        width: 300.0,
        height: 175.0,
        constraints: BoxConstraints(
          maxWidth: 600.0,
        ),
        decoration: BoxDecoration(),
        child: Padding(
          padding: EdgeInsets.all(8.0),
          child: Column(
            mainAxisSize: MainAxisSize.max,
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              Icon(
                Icons.filter_none_rounded,
                color: Color(0xFF7C8791),
                size: 90.0,
              ),
              Padding(
                padding: EdgeInsetsDirectional.fromSTEB(0.0, 24.0, 0.0, 0.0),
                child: Row(
                  mainAxisSize: MainAxisSize.max,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'No Entries are Pending',
                      textAlign: TextAlign.center,
                      style:
                          FlutterFlowTheme.of(context).headlineSmall.override(
                                font: GoogleFonts.outfit(
                                  fontWeight: FontWeight.w500,
                                  fontStyle: FlutterFlowTheme.of(context)
                                      .headlineSmall
                                      .fontStyle,
                                ),
                                color: FlutterFlowTheme.of(context).primaryText,
                                fontSize: 18.0,
                                letterSpacing: 0.0,
                                fontWeight: FontWeight.w500,
                                fontStyle: FlutterFlowTheme.of(context)
                                    .headlineSmall
                                    .fontStyle,
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
