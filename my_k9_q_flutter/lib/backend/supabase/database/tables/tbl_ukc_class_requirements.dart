import '../database.dart';

class TblUkcClassRequirementsTable
    extends SupabaseTable<TblUkcClassRequirementsRow> {
  @override
  String get tableName => 'tbl_ukc_class_requirements';

  @override
  TblUkcClassRequirementsRow createRow(Map<String, dynamic> data) =>
      TblUkcClassRequirementsRow(data);
}

class TblUkcClassRequirementsRow extends SupabaseDataRow {
  TblUkcClassRequirementsRow(Map<String, dynamic> data) : super(data);

  @override
  SupabaseTable get table => TblUkcClassRequirementsTable();

  int get ukcClassRequirementsId => getField<int>('ukc_class_requirements_id')!;
  set ukcClassRequirementsId(int value) =>
      setField<int>('ukc_class_requirements_id', value);

  String? get element => getField<String>('element');
  set element(String? value) => setField<String>('element', value);

  String? get level => getField<String>('level');
  set level(String? value) => setField<String>('level', value);

  String? get items => getField<String>('items');
  set items(String? value) => setField<String>('items', value);

  String? get hides => getField<String>('hides');
  set hides(String? value) => setField<String>('hides', value);

  String? get distractions => getField<String>('distractions');
  set distractions(String? value) => setField<String>('distractions', value);

  String? get timeLimitText => getField<String>('time_limit_text');
  set timeLimitText(String? value) =>
      setField<String>('time_limit_text', value);

  String? get height => getField<String>('height');
  set height(String? value) => setField<String>('height', value);

  int? get areaCount => getField<int>('area_count');
  set areaCount(int? value) => setField<int>('area_count', value);

  String? get finalResponse => getField<String>('final_response');
  set finalResponse(String? value) => setField<String>('final_response', value);

  String? get areaSize => getField<String>('area_size');
  set areaSize(String? value) => setField<String>('area_size', value);
}
