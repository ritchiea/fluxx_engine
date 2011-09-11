class ActiveRecord::Relation
  def to_temp_table name
    result = nil
    begin
      ClientStore.connection.execute "DROP TEMPORARY TABLE IF EXISTS #{name}"
      ClientStore.connection.execute "CREATE TEMPORARY TABLE #{name} #{self.to_sql}"
      result = yield name
    ensure
      ClientStore.connection.execute "DROP TEMPORARY TABLE #{name}" rescue nil
    end
    result
  end
  
  def select_top_by_key key_field, amount_field, quantity=10, ordering='desc', table_name=nil
    table_name = "table_#{Time.now.to_i}_#{rand(9999)}" unless table_name
    to_temp_table(table_name) do |table_name|
      limit_clause = ''
      limit_clause = "limit #{quantity}" if quantity
      result = ClientStore.connection.execute "SELECT #{key_field}, #{amount_field} from #{table_name} order by #{amount_field} #{ordering} #{limit_clause}"
      top_hits = {}
      while row = result.fetch_hash do
        top_hits[row[key_field].to_i] = BigDecimal(row[amount_field]) if row[amount_field] && row[key_field]
      end
      result = ClientStore.connection.execute ClientStore.send(:sanitize_sql, ["SELECT SUM(#{amount_field}) total_other from #{table_name} WHERE #{key_field} NOT IN (?)", top_hits.keys])
      row = result.fetch_row
      other_amount = row.first if row
      top_hits[nil] = BigDecimal(other_amount) if other_amount
      top_hits
    end
  end
end