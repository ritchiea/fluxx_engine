class Array
  def up_to element
    found = false
    select do |x| 
      unless found
        found = true if x == element
        true
      end
    end
  end

  def down_to element
    found = false
    self.reverse.select do |x| 
      unless found
        found = true if x == element
        true
      end
    end
  end
  
  def dupes_by_field field_name='name', threshold=5, trunc_size=5
    threshold = threshold.to_i
    trunc_size = trunc_size.to_i
    records_sorted = self.sort_by {|field| field.send(field_name.to_sym).downcase}
    
    dupe_records = (0..records_sorted.size-2).map do |offset|
      p "ESH: at offset #{offset}" if offset%50 == 0
      a, b = [records_sorted[offset].send(field_name.to_sym), records_sorted[offset+1].send(field_name.to_sym)]
      trunced_a = a[trunc_size..(a.size)]
      trunced_b = b[trunc_size..(b.size)]
      if a.size > trunc_size * 2 && b.size > trunc_size * 2
        [records_sorted[offset], records_sorted[offset+1]] if !trunced_a.blank? && !trunced_b.blank? && (trunced_a.levenshtein(trunced_b) < threshold)
      else
        # Don't trunc if the size of the originals is not more than twice the trunc_size
        [records_sorted[offset], records_sorted[offset+1]] if !a.blank? && !b.blank? && (a.levenshtein(b) < threshold)
      end
    end.compact
    
    coalesced_records = [dupe_records.first]
    (1..dupe_records.size-1).map do |offset|
      # the dupe_records is a set of records which looks something like:
      #    [[1, 2], [2, 3], [4, 5], [5, 6]] 
      # This should be coalesced into something like:
      #    [[1, 2, 3], [4, 5, 6]] 
      cur_dupe_record_pair = dupe_records[offset]
      if coalesced_records.last.last == cur_dupe_record_pair.first
        coalesced_records.last << cur_dupe_record_pair[1]
      else
        coalesced_records << cur_dupe_record_pair
      end
    end
    coalesced_records
  end
  
  # Take an array representing a request to access attributes of a model object
  # and execute it:
  # user.primary_organization.name
  # Should get expanded to:
  # user ? (user.primary_organization ? user.primary_organization.name : nil) : nil
  def execute_model model
     eval_string = execute_model_for_offset
     eval eval_string
  end
  
  private
  def execute_model_for_offset offset=0
    if offset < self.size
      s = ((['model'] + self)[0..offset]).join '.'
      "(#{s} ? #{execute_model_for_offset(offset + 1) || ((['model'] + self).join '.')} : nil)"
    end
  end
end