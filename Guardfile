guard 'shell' do

  watch(/src\/local.redis\.[0-9]*\.js/) do |m|
    puts "Detected change on #{m}. Rebuilding local.redis.min.js #{Time.now.strftime("%H:%M:%S")}"
    `java -jar lib/compiler.jar --js src/local.redis\.*js --js_output_file src/local.redis.min.js`
  end
end
