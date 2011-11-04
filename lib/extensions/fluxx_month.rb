# This is useful if you want to iterate over by months
# 
# t1 = Month.today - 1.year
# t2 = Month.today + 1.year
# (t1..t2).each {|dd| p "ESH: have dd=#{dd}"}
# This will step by month
class Month < Date
  def succ
    self >> 1
  end
end
