import '../database.dart';

class TblReorderTable extends SupabaseTable<TblReorderRow> {
  @override
  String get tableName => 'tbl_reorder';

  @override
  TblReorderRow createRow(Map<String, dynamic> data) => TblReorderRow(data);
}

class TblReorderRow extends SupabaseDataRow {
  TblReorderRow(Map<String, dynamic> data) : super(data);

  @override
  SupabaseTable get table => TblReorderTable();

  int get id => getField<int>('id')!;
  set id(int value) => setField<int>('id', value);

  DateTime get createdAt => getField<DateTime>('created_at')!;
  set createdAt(DateTime value) => setField<DateTime>('created_at', value);

  String? get name => getField<String>('name');
  set name(String? value) => setField<String>('name', value);

  int get sortOrder => getField<int>('sort_order')!;
  set sortOrder(int value) => setField<int>('sort_order', value);
}
