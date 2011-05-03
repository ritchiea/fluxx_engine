module FluxxModuleHelper
  def included(base)
    super
    base.instance_eval(&@included_block) if @included_block

    base.extend(@class_methods_module) if @class_methods_module

    if @instance_methods_module
      instance_methods_module = @instance_methods_module
      base.class_eval do
        include instance_methods_module
      end
    end
  end

  def when_included(&block)
    @included_block = block
  end

  def class_methods(&block)
    @class_methods_module = Module.new do
      module_eval(&block)
    end
  end

  def instance_methods(&block)
    @instance_methods_module = Module.new do
      module_eval(&block)
    end
  end
end
