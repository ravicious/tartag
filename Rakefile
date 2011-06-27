# encoding: utf-8

require "rake"

desc "Shows project stats (using cloc)"
task :stats do |t|
  puts `cloc . --exclude-list-file=.clocignore`
end

desc "Deploy code to gh-pages (production)"
task :deploy do
  `git checkout gh-pages && git merge master && git push origin gh-pages && git checkout master`
end

desc "Minifies vendor files"
task :minify do
  files = ["jquery-ui-1.8.7.custom.min.js", "json2.js", "jquery.jsonp-2.1.4.min.js", "underscore-min.js", "backbone-min.js", "backbone-localstorage.js", "additional_functions.js"]
  minified_content = ""

  files.each do |filename|

    if filename.include?('min.js')
      content = File.read("vendor/#{filename}")
    else
      content = `closure --js=vendor/#{filename}`
    end

    minified_content += content
  end

  File.open('vendor/vendor_minified.js', 'w') do |file|
    file.puts minified_content
  end
end
