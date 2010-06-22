class CreateInstruments < ActiveRecord::Migration
  def self.up
    create_table :instruments do |t|
      t.timestamps
      t.string :name
      t.date :date_of_birth
      t.date :deleted_at
    end
  end

  def self.down
    drop_table :instruments
  end
end
