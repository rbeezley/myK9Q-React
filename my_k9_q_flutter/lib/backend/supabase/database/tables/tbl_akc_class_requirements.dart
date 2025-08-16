import '../database.dart';

class TblAkcClassRequirementsTable
    extends SupabaseTable<TblAkcClassRequirementsRow> {
  @override
  String get tableName => 'tbl_akc_class_requirements';

  @override
  TblAkcClassRequirementsRow createRow(Map<String, dynamic> data) =>
      TblAkcClassRequirementsRow(data);
}

class TblAkcClassRequirementsRow extends SupabaseDataRow {
  TblAkcClassRequirementsRow(Map<String, dynamic> data) : super(data);

  @override
  SupabaseTable get table => TblAkcClassRequirementsTable();

  int get akcClassRequirementsId => getField<int>('akc_class_requirements_id')!;
  set akcClassRequirementsId(int value) =>
      setField<int>('akc_class_requirements_id', value);

  String? get element => getField<String>('element');
  set element(String? value) => setField<String>('element', value);

  String? get level => getField<String>('level');
  set level(String? value) => setField<String>('level', value);

  String? get hides => getField<String>('hides');
  set hides(String? value) => setField<String>('hides', value);

  String? get distractions => getField<String>('distractions');
  set distractions(String? value) => setField<String>('distractions', value);

  String? get height => getField<String>('height');
  set height(String? value) => setField<String>('height', value);

  String? get requiredCalls => getField<String>('required_calls');
  set requiredCalls(String? value) => setField<String>('required_calls', value);

  int? get areaCount => getField<int>('area_count');
  set areaCount(int? value) => setField<int>('area_count', value);

  String? get timeLimitText => getField<String>('time_limit_text');
  set timeLimitText(String? value) =>
      setField<String>('time_limit_text', value);

  String? get containers => getField<String>('containers');
  set containers(String? value) => setField<String>('containers', value);

  String? get areaSize => getField<String>('area_size');
  set areaSize(String? value) => setField<String>('area_size', value);
}
