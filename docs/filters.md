# Custom Nunjucks filters and function

## `tr` filter

The `tr` filter automatically localize a string. Usage:

```
<button type="submit" class="btn btn-primary px-4">{{ "button_login" | tr }}</button>
```

The `button_login` shall be a property in a JSON localization file.

## `json` filter

The `json` filter automatically format an object or variable to a JSON representation.
It can be used for debug purpose, or to convert a server object to a Javascript object usable in the browser. For example:

```
<script>
var fromServer = {{ variableFromTheContext | json }};
</script>
```

## `format` filter

The `format` filter format a number to a string, with a fixed number of decimal digits (default: 2). The "dot" character is used to separate the decimal digits. No separator is used for the hundreds.
Usage:

```
<span class="price">€ {{ price | format }}</span>
<span class="integer_number">{{ myNumber | format(0) }}
```

## `date` filter

The `date` filter format a date to a localized string, using `moment`. The default format will use the
`lll` format. It is possible to use custom formatting values passing them as filter parameter.

The filter tries to detect the current language of the request (falling back to the application default language).

The filter works both with `Date`, `moment` or string-formatted value. If the filtered value is `falsy`, an empty string is returned.

Usage:

```
<span class="date">€ {{ data.createdAt | date }}</span>
<span class="my_date_custom">{{ data.createdAt | date("YYYY-MM-DD") }}
```

## `route` global function

The `route` function compile a route name to an url with the given parameters.

The first argument of the `route` function shall be a named route (a method of a controlled decorated with `Name`) or an url.
The second argument shall be an object with the parameters needed to compile the url. It can be omitted (and no parameters will be used).

If a route is defined with a path parameter (for example, `example/:id/details`), the second argument should have a property with the associated value (in the example, it should be `{ id: 12 }`). Any additional property specified in the second argument will be added as query parameter.
In this example, the result of the `route` function will be `example/12/details`.

Usage:

```
<a href="{{route('forgot_password')}}" class="btn btn-link px-0">...</a>
```

will generate an url using the named route 'forgot_password'.

With parameter:

```
<a href="{{route('details', { id: 12, order: 'age' })}}" class="btn btn-link px-0">...</a>
```

will generate something like `path/details/12?order=age`.

## `old` global function

The `old` function is used to retrieve the latest value of a form. It can be used to retrieve the value of an input when a server side form validation is failed, or if a request has an error. In this way, the form will be presented to the user with the latests modification. It is also possible to specify a default value (useful to managed form with editing object).
Usage:

```
<input type="email" name="email" class="form-control" value="{{old('email', customer.email)}}">
```

In this case, the `email` filed will be filled with the original `customer.email` value or with the latest inserted value be the user.

## `currentHost` global function

The `currentHost` function is used to retrieve the current server host. This can be used, with the `route` function, to generate an absolute
url (for example, needed to generate an url for an email). The usage of this method is discouraged whenever possible.
