Time::DATE_FORMATS[:date_time_seconds] = "%m/%d/%Y %H:%M:%S"
Time::DATE_FORMATS[:date_time] = "%m/%d/%Y %H:%M"
Time::DATE_FORMATS[:time] = "%B %Y"
Time::DATE_FORMATS[:mdy] = "%m/%d/%Y"
Time::DATE_FORMATS[:star_mdy] = "*%m/*%d/%y"
Time::DATE_FORMATS[:full] = "%B %d, %Y"
Time::DATE_FORMATS[:star_full] = "%B *%d, %Y"
Time::DATE_FORMATS[:hours_minutes] = "%H:%M"
Time::DATE_FORMATS[:star_hours_minutes] = "*%H:%M"
Time::DATE_FORMATS[:hours_minutes_ampm] = "%I:%M %p"
Time::DATE_FORMATS[:star_hours_minutes_ampm] = "*%I:%M %p"
Time::DATE_FORMATS[:msoft] = "%Y-%m-%dT%H:%M:%S.000"
Time::DATE_FORMATS[:sql] = "%Y-%m-%d"
Time::DATE_FORMATS[:hgrant] = "%Y%m%dT%H:%M-0000"
Time::DATE_FORMATS[:month_year] = "%B, %Y"
Time::DATE_FORMATS[:abbrev_month_year] = "%b, %Y"


def strip_zeros_from_date(marked_date_string)
  marked_date_string.gsub('*0', '').gsub('*', '')
end

class Time
  def abbrev_month_year
    self.to_s(:abbrev_month_year)
  end
  def month_year
    self.to_s(:month_year)
  end
  def msoft
    self.to_s(:msoft)
  end
  
  def hgrant
    self.to_s(:hgrant)
  end
  
  def sql
    self.to_s(:sql)
  end
  
  def ampm_time
    "#{strip_zeros_from_date(self.to_s(:star_hours_minutes_ampm))}"
  end
  def mdy_time
    "#{self.mdy} #{strip_zeros_from_date(self.to_s(:star_hours_minutes))}" 
  end
  def mdy
    strip_zeros_from_date(self.to_s(:star_mdy))
  end
  
  def full
    strip_zeros_from_date(self.to_s(:star_full))
  end
  
  def date_time_seconds
    self.to_s(:date_time_seconds)
  end
  
  def date_time
    self.to_s(:date_time)
  end
  

  def next_business_day
    skip_weekends 1
  end    

  def previous_business_day
    skip_weekends -1
  end

  def skip_weekends inc
    date = self
    date += inc
    while (date.wday % 7 == 0) or (date.wday % 7 == 6) do
      date += inc
    end
    date
  end
end