require 'test_helper'

class ModelDslLockTest < ActiveSupport::TestCase
  def setup
    @dsl_lock = ActiveRecord::ModelDslLock.new Instrument
  end
  
  test "test lock_time_interval" do
    ActiveRecord::ModelDslLock.lock_time_interval = 10.hours
    assert_equal 10.hours, ActiveRecord::ModelDslLock.lock_time_interval
  end

  test "test editable on musician which does not have locked_until and locked_by" do
    musician1 = Musician.make
    musician2 = Musician.make
    assert @dsl_lock.editable?(musician1, musician2)
  end
  
  test "test editable on instrument which has locked_until and locked_by" do
    instrument = Instrument.make
    musician = Musician.make
    assert @dsl_lock.editable?(instrument, musician)
  end
  
  test "test not editable on instrument which is locked by a different musician" do
    locking_musician = Musician.make
    instrument = Instrument.make :locked_by => locking_musician
    instrument.locked_until = Time.now + 5.minutes
    musician = Musician.make
    assert !@dsl_lock.editable?(instrument, musician)
  end

  test "test editable on instrument which is locked by a different musician on an expired lock" do
    locking_musician = Musician.make
    instrument = Instrument.make :locked_by => locking_musician
    instrument.locked_until = Time.now - 5.minutes
    musician = Musician.make
    assert @dsl_lock.editable?(instrument, musician)
  end

  test "test editable on instrument which is locked by same musician" do
    musician = Musician.make
    instrument = Instrument.make :locked_by => musician
    instrument.locked_until = Time.now + 5.minutes
    assert @dsl_lock.editable?(instrument, musician)
  end
  
  test "test ability to add_lock on unlocked instrument" do
    musician = Musician.make
    instrument = Instrument.make
    assert @dsl_lock.add_lock(instrument, musician)
    assert instrument.locked_until
    assert_equal musician, instrument.locked_by
  end

  test "test ability to add_lock on expired locked instrument" do
    locking_musician = Musician.make
    musician = Musician.make
    instrument = Instrument.make
    assert @dsl_lock.add_lock(instrument, locking_musician)
    assert instrument.locked_until
    instrument.locked_until = Time.now - 5.minutes
  end
  
  test "test inability to add_lock on a locked instrument by a different musician" do
    locking_musician = Musician.make
    musician = Musician.make
    instrument = Instrument.make
    @dsl_lock.add_lock(instrument, locking_musician)
    assert !@dsl_lock.add_lock(instrument, musician)
  end

  test "test ability to remove_lock on locked instrument" do
    musician = Musician.make
    instrument = Instrument.make
    assert @dsl_lock.add_lock(instrument, musician)
    assert @dsl_lock.remove_lock(instrument, musician)
  end
  
  test "test inability to remove_lock on a locked instrument by a different musician" do
    locking_musician = Musician.make
    musician = Musician.make
    instrument = Instrument.make
    @dsl_lock.add_lock(instrument, locking_musician)
    assert !@dsl_lock.remove_lock(instrument, musician)
  end
  
  test "test ability to extend_lock on locked instrument" do
    musician = Musician.make
    instrument = Instrument.make
    assert @dsl_lock.add_lock(instrument, musician)
    before_locked_until = instrument.locked_until
    assert @dsl_lock.extend_lock(instrument, musician)
    assert instrument.locked_until
    assert before_locked_until < instrument.locked_until
  end
  
  test "test ability to extend_lock on nonlocked instrument" do
    musician = Musician.make
    instrument = Instrument.make
    assert @dsl_lock.extend_lock(instrument, musician)
    assert instrument.locked_until
  end
end